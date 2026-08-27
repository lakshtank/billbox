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

  try {
    const products = await Product.find({
      warrantyStatus: { $in: ['active', 'expiring_soon'] },
      warrantyExpiryDate: { $ne: null },
    })
      .populate('userId', 'name email timezone')
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

      const timezone = user.timezone || 'UTC';
      const daysRemaining = calculateDaysRemainingInTimezone(product.warrantyExpiryDate, timezone, referenceDate);

      let shouldSendEmail = false;
      const flagsToSet = [];

      if (daysRemaining <= 30 && !product.remindersSent?.days30) {
        shouldSendEmail = true;
        flagsToSet.push('days30');
      }
      if (daysRemaining <= 15 && !product.remindersSent?.days15) {
        shouldSendEmail = true;
        flagsToSet.push('days15');
      }
      if (daysRemaining <= 7 && !product.remindersSent?.days7) {
        shouldSendEmail = true;
        flagsToSet.push('days7');
      }
      if (daysRemaining <= 1 && !product.remindersSent?.days1) {
        shouldSendEmail = true;
        flagsToSet.push('days1');
      }

      if (shouldSendEmail) {
        console.log(
          `[ReminderService] Triggering reminder for product "${product.productName}" (ID: ${product._id}) - ${daysRemaining} days remaining (User: ${user.email}).`
        );

        const emailSent = await sendWarrantyReminderEmail({
          to: user.email,
          userName: user.name,
          productName: product.productName || 'Purchased Item',
          storeName: receipt?.storeName || 'N/A',
          warrantyExpiryDate: product.warrantyExpiryDate,
          daysRemaining: Math.max(0, daysRemaining),
        });

        if (emailSent) {
          if (!product.remindersSent) {
            product.remindersSent = {};
          }
          flagsToSet.forEach((flag) => {
            product.remindersSent[flag] = true;
          });

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
          errorCount++;
        }
      }
    }
  } catch (error) {
    console.error('[ReminderService] Error during warranty reminder check:', error.message);
    errorCount++;
  }

  console.log(
    `[ReminderService] Check finished. Checked: ${checked}, Reminders Sent: ${remindersSentCount}, Errors: ${errorCount}`
  );

  return { checked, remindersSentCount, errors: errorCount };
};

module.exports = {
  runWarrantyReminderCheck,
  calculateDaysRemainingInTimezone,
};
