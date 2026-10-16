const Product = require('../models/Product.model');
const ReminderLog = require('../models/ReminderLog.model');
const { sendWarrantyReminderEmail } = require('./email.service');

/**
 * Returns YYYY-MM-DD calendar date string formatted in a specific timezone
 */
const getCalendarDateInTimezone = (date, timeZone = 'UTC') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date(date));
  } catch (err) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
};

/**
 * Calculates whole days remaining between reference date and expiry date in user's timezone.
 */
const calculateDaysRemainingInTimezone = (expiryDate, userTimezone = 'UTC', referenceDate = new Date()) => {
  const todayStr = getCalendarDateInTimezone(referenceDate, userTimezone);
  const expiryStr = getCalendarDateInTimezone(expiryDate, userTimezone);

  const todayUTC = new Date(`${todayStr}T00:00:00.000Z`);
  const expiryUTC = new Date(`${expiryStr}T00:00:00.000Z`);

  const diffMs = expiryUTC.getTime() - todayUTC.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Runs daily warranty reminder check across all active/expiring_soon products.
 * Sends milestone email notifications (30, 15, 7, 1 days) and updates remindersSent flags on Product.
 */
const runWarrantyReminderCheck = async (referenceDate = new Date()) => {
  console.log(`[ReminderService] Running per-product warranty reminder check (Ref Date: ${referenceDate.toISOString()})...`);
  
  let checked = 0;
  let remindersSentCount = 0;
  let errorCount = 0;
  let notConfiguredCount = 0;

  try {
    const products = await Product.find({
      warrantyStatus: { $in: ['active', 'expiring_soon'] },
      warrantyExpiryDate: { $ne: null },
    })
      .populate('userId', 'name email timezone notificationPreferences')
      .populate('receiptId', 'storeName');

    console.log(`[ReminderService] Found ${products.length} product(s) eligible for reminder check.`);

    for (const product of products) {
      checked++;
      if (product.reminderEnabled === false) {
        continue;
      }

      const user = product.userId;
      const receipt = product.receiptId;

      if (!user || !user.email) {
        console.warn(`[ReminderService] Product ${product._id} has no valid associated user/email. Skipping.`);
        continue;
      }

      // Respect user notification preferences
      if (user.notificationPreferences?.emailAlerts === false) {
        console.log(`[ReminderService] User ${user.email} has disabled email alerts. Skipping email notification.`);
        continue;
      }

      const timezone = user.timezone || 'UTC';
      const daysRemaining = calculateDaysRemainingInTimezone(product.warrantyExpiryDate, timezone, referenceDate);

      // Transition already-expired products to 'expired' and skip sending "expiring soon" alerts
      if (daysRemaining < 0) {
        if (product.warrantyStatus !== 'expired') {
          product.warrantyStatus = 'expired';
          await product.save();
        }
        continue;
      }

      // Determine single active milestone interval to prevent simultaneous multi-flag firing
      let activeMilestone = null;

      if (daysRemaining <= 1) {
        if (!product.remindersSent?.days1) {
          activeMilestone = 'days1';
        }
      } else if (daysRemaining <= 7) {
        if (!product.remindersSent?.days7) {
          activeMilestone = 'days7';
        }
      } else if (daysRemaining <= 15) {
        if (!product.remindersSent?.days15) {
          activeMilestone = 'days15';
        }
      } else if (daysRemaining <= 30) {
        if (!product.remindersSent?.days30) {
          activeMilestone = 'days30';
        }
      }

      if (activeMilestone) {
        // Check user's preferred advance notice window (default 30 days)
        const maxNoticeDays = user.notificationPreferences?.expiryDaysNotice || 30;
        if (daysRemaining > maxNoticeDays) {
          continue;
        }

        console.log(
          `[ReminderService] Triggering milestone (${activeMilestone}) for product "${product.productName}" (ID: ${product._id}) - ${daysRemaining} days remaining (User: ${user.email}).`
        );

        const deliveryResult = await sendWarrantyReminderEmail({
          to: user.email,
          userName: user.name,
          productName: product.productName || 'Purchased Item',
          storeName: receipt?.storeName || 'N/A',
          warrantyExpiryDate: product.warrantyExpiryDate,
          daysRemaining: Math.max(0, daysRemaining),
        });

        if (deliveryResult.delivered) {
          if (!product.remindersSent) {
            product.remindersSent = {};
          }

          // Mark current milestone
          product.remindersSent[activeMilestone] = true;

          // If triggered at a tighter milestone, acknowledge prior skipped milestones so they never backfire
          if (activeMilestone === 'days7') {
            product.remindersSent.days30 = true;
            product.remindersSent.days15 = true;
          } else if (activeMilestone === 'days15') {
            product.remindersSent.days30 = true;
          } else if (activeMilestone === 'days1') {
            product.remindersSent.days30 = true;
            product.remindersSent.days15 = true;
            product.remindersSent.days7 = true;
          }

          // Update warranty status to 'expiring_soon' if not already
          if (product.warrantyStatus !== 'expiring_soon') {
            product.warrantyStatus = 'expiring_soon';
          }

          await product.save();

          // Record in ReminderLog
          await ReminderLog.create({
            userId: user._id,
            productId: product._id,
            receiptId: product.receiptId?._id || null,
            productName: product.productName,
            storeName: receipt?.storeName || '',
            leadDays: daysRemaining,
            recipientEmail: user.email,
            status: 'sent',
            sentAt: new Date(),
          });

          remindersSentCount++;
        } else {
          // Nothing was delivered. Leave remindersSent untouched so the milestone
          // is retried once delivery is possible, and record the failure honestly.
          if (deliveryResult.reason === 'not_configured') {
            notConfiguredCount++;
          } else {
            errorCount++;
          }

          await ReminderLog.create({
            userId: user._id,
            productId: product._id,
            receiptId: product.receiptId?._id || null,
            productName: product.productName,
            storeName: receipt?.storeName || '',
            leadDays: daysRemaining,
            recipientEmail: user.email,
            status: deliveryResult.reason === 'not_configured' ? 'skipped' : 'failed',
            failureReason: deliveryResult.error || '',
            sentAt: new Date(),
          });
        }
      }
    }
  } catch (error) {
    console.error('[ReminderService] Error during warranty reminder check:', error.message);
    errorCount++;
  }

  if (notConfiguredCount > 0) {
    console.warn(
      `[ReminderService] ${notConfiguredCount} reminder(s) could not be sent because SMTP is not configured. They will be retried on the next run.`
    );
  }

  console.log(
    `[ReminderService] Check finished. Checked: ${checked}, Delivered: ${remindersSentCount}, Skipped (no SMTP): ${notConfiguredCount}, Errors: ${errorCount}`
  );

  return {
    checked,
    remindersSentCount,
    skipped: notConfiguredCount,
    errors: errorCount,
  };
};

module.exports = {
  runWarrantyReminderCheck,
  calculateDaysRemainingInTimezone,
};
