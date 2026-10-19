const Product = require('../models/Product.model');
const Receipt = require('../models/Receipt.model');
const User = require('../models/User.model');
const ReminderLog = require('../models/ReminderLog.model');
const { sendWarrantyReminderEmail, renderWarrantyEmailHtml } = require('../services/email.service');
const { runWarrantyReminderCheck } = require('../services/reminder.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/reminders
// Returns all warranty-tracked products with notification settings and reminder logs
const getReminders = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { status = 'all', search = '' } = req.query;

    const query = {
      userId,
      warrantyExpiryDate: { $ne: null },
    };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { productName: searchRegex },
        { brand: searchRegex },
      ];
    }

    const allWarrantyProducts = await Product.find(query)
      .populate('receiptId', 'storeName purchaseDate invoiceNumber currency')
      .sort({ warrantyExpiryDate: 1 });

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const items = allWarrantyProducts.map((p) => {
      const expiry = new Date(p.warrantyExpiryDate);
      const expiryMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
      const diffMs = expiryMidnight.getTime() - todayMidnight.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const leadDays = typeof p.reminderLeadDays === 'number' ? p.reminderLeadDays : 30;
      const reminderEnabled = p.reminderEnabled !== false;

      const nextReminderDate = new Date(expiry.getTime() - leadDays * 24 * 60 * 60 * 1000);

      return {
        _id: p._id,
        productName: p.productName,
        brand: p.brand,
        category: p.category,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        lineTotal: p.lineTotal,
        warrantyPeriodMonths: p.warrantyPeriodMonths,
        warrantyExpiryDate: p.warrantyExpiryDate,
        warrantyStatus: p.warrantyStatus,
        daysRemaining,
        reminderEnabled,
        reminderLeadDays: leadDays,
        nextReminderDate,
        remindersSent: p.remindersSent || {},
        receipt: p.receiptId
          ? {
              _id: p.receiptId._id,
              storeName: p.receiptId.storeName,
              purchaseDate: p.receiptId.purchaseDate,
              invoiceNumber: p.receiptId.invoiceNumber,
            }
          : null,
      };
    });

    // Compute Summary Stats
    const totalTracked = items.length;
    const remindersEnabledCount = items.filter((i) => i.reminderEnabled && i.daysRemaining > 0).length;
    const dueSoonCount = items.filter((i) => i.daysRemaining <= 30 && i.daysRemaining > 0).length;
    const logsSentCount = await ReminderLog.countDocuments({ userId });

    // Filter items according to tab status if requested
    let filteredItems = items;
    if (status === 'active') {
      filteredItems = items.filter((i) => i.daysRemaining > 0 && i.reminderEnabled);
    } else if (status === 'due_soon') {
      filteredItems = items.filter((i) => i.daysRemaining <= 30 && i.daysRemaining > 0);
    } else if (status === 'disabled') {
      filteredItems = items.filter((i) => !i.reminderEnabled);
    } else if (status === 'expired') {
      filteredItems = items.filter((i) => i.daysRemaining <= 0);
    }

    // Fetch recent reminder logs
    const recentLogs = await ReminderLog.find({ userId })
      .sort({ sentAt: -1 })
      .limit(20);

    // Check whether SMTP is configured
    const isEmailConfigured = Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      !process.env.SMTP_USER.includes('your_smtp_user') &&
      !process.env.SMTP_PASS.includes('your_smtp_password')
    );

    return sendSuccess(res, 200, 'Reminders fetched successfully', {
      stats: {
        totalTracked,
        remindersEnabled: remindersEnabledCount,
        dueSoonCount,
        logsSentCount,
        isEmailConfigured,
      },
      items: filteredItems,
      logs: recentLogs,
    });
  } catch (error) {
    console.error('getReminders error:', error);
    return sendError(res, 500, 'Failed to fetch reminders');
  }
};

// PATCH /api/reminders/:productId
// Updates reminderEnabled toggle and reminderLeadDays
const updateReminderSettings = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { productId } = req.params;
    const { reminderEnabled, reminderLeadDays } = req.body;

    const product = await Product.findOne({ _id: productId, userId });
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    if (reminderEnabled !== undefined) {
      product.reminderEnabled = Boolean(reminderEnabled);
    }

    if (reminderLeadDays !== undefined) {
      const days = parseInt(reminderLeadDays, 10);
      if (!isNaN(days) && days > 0) {
        product.reminderLeadDays = days;
      }
    }

    await product.save();

    return sendSuccess(res, 200, 'Reminder settings updated successfully', {
      productId: product._id,
      reminderEnabled: product.reminderEnabled,
      reminderLeadDays: product.reminderLeadDays,
    });
  } catch (error) {
    console.error('updateReminderSettings error:', error);
    return sendError(res, 500, 'Failed to update reminder settings');
  }
};

// POST /api/reminders/:productId/test
// Sends an immediate test reminder email to the logged in user
const testSendReminder = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { productId } = req.params;

    const [user, product] = await Promise.all([
      User.findById(userId),
      Product.findOne({ _id: productId, userId }).populate('receiptId', 'storeName'),
    ]);

    if (!user || !user.email) {
      return sendError(res, 400, 'User has no valid email registered');
    }

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    const expiryDate = product.warrantyExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const storeName = product.receiptId?.storeName || 'Merchant';

    const now = new Date();
    const diffMs = new Date(expiryDate).getTime() - now.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const delivery = await sendWarrantyReminderEmail({
      to: user.email,
      userName: user.name || 'BillBox User',
      productName: product.productName,
      storeName,
      warrantyExpiryDate: expiryDate,
      daysRemaining,
    });

    const status = delivery.delivered
      ? 'sent'
      : delivery.reason === 'not_configured'
      ? 'skipped'
      : 'failed';

    // Record in ReminderLog
    const log = await ReminderLog.create({
      userId,
      productId: product._id,
      receiptId: product.receiptId?._id || null,
      productName: product.productName,
      storeName,
      leadDays: product.reminderLeadDays || 30,
      recipientEmail: user.email,
      status,
      failureReason: delivery.error || '',
      sentAt: new Date(),
    });

    if (!delivery.delivered) {
      return sendError(
        res,
        delivery.reason === 'not_configured' ? 503 : 502,
        delivery.reason === 'not_configured'
          ? 'Email is not configured on this server, so no reminder was sent.'
          : `Could not send the reminder: ${delivery.error || 'delivery failed'}`,
        [{ field: 'email', message: delivery.error || 'Delivery failed.' }]
      );
    }

    return sendSuccess(res, 200, `Test reminder sent to ${user.email}`, { log });
  } catch (error) {
    console.error('testSendReminder error:', error);
    return sendError(res, 500, 'Failed to send test reminder');
  }
};

// POST /api/reminders/test-alert
// Sends a live test alert to verify notification preferences
const sendTestAlert = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId);

    if (!user || !user.email) {
      return sendError(res, 400, 'User email not found.');
    }

    const product = await Product.findOne({ userId, warrantyExpiryDate: { $ne: null } }).populate('receiptId', 'storeName');
    const productName = product?.productName || 'Apple MacBook Pro M3';
    const storeName = product?.receiptId?.storeName || 'Apple Store';
    const expiryDate = product?.warrantyExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const delivery = await sendWarrantyReminderEmail({
      to: user.email,
      userName: user.name || 'BillBox User',
      productName,
      storeName,
      warrantyExpiryDate: expiryDate,
      daysRemaining: 30,
    });

    const status = delivery.delivered
      ? 'sent'
      : delivery.reason === 'not_configured'
      ? 'skipped'
      : 'failed';

    let log = null;
    if (product?._id) {
      log = await ReminderLog.create({
        userId,
        productId: product._id,
        receiptId: product.receiptId?._id || null,
        productName,
        storeName,
        leadDays: 30,
        recipientEmail: user.email,
        status,
        failureReason: delivery.error || '',
        sentAt: new Date(),
      });
    }

    if (!delivery.delivered) {
      return sendError(
        res,
        delivery.reason === 'not_configured' ? 503 : 502,
        delivery.reason === 'not_configured'
          ? 'Email is not configured on this server, so no test alert was sent.'
          : `Could not send the test alert to ${user.email}: ${delivery.error || 'delivery failed'}`,
        [{ field: 'email', message: delivery.error || 'Delivery failed.' }]
      );
    }

    return sendSuccess(res, 200, `Test alert sent to ${user.email}`, { log });
  } catch (error) {
    console.error('sendTestAlert error:', error);
    return sendError(res, 500, 'Failed to send test alert');
  }
};

// GET / POST /api/reminders/cron-check
// Automated serverless / cloud webhook triggered by Vercel Cron or external schedulers
const triggerCronReminderCheck = async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    const customHeader = req.headers['x-cron-secret'];
    const querySecret = req.query?.secret;

    // Verify secret if configured or in production
    if (cronSecret) {
      const isBearerValid = authHeader === `Bearer ${cronSecret}`;
      const isHeaderValid = customHeader === cronSecret;
      const isQueryValid = querySecret === cronSecret;

      if (!isBearerValid && !isHeaderValid && !isQueryValid) {
        return sendError(res, 401, 'Unauthorized: Invalid or missing cron authorization secret');
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[Cron] Warning: CRON_SECRET is not configured in production environment.');
    }

    console.log('[Cron] Invoking runWarrantyReminderCheck via webhook...');
    const results = await runWarrantyReminderCheck();

    return sendSuccess(res, 200, 'Warranty reminder cron execution completed successfully', {
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('[Cron] Execution error in triggerCronReminderCheck:', error);
    return sendError(res, 500, 'Warranty reminder cron execution failed', { error: error.message });
  }
};

// GET /api/reminders/preview-email/:productId
// Generates live HTML email template preview for an item
const previewWarrantyEmail = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { productId } = req.params;

    const user = await User.findById(userId);
    let product = null;

    if (productId && productId !== 'sample') {
      product = await Product.findOne({ _id: productId, userId }).populate('receiptId', 'storeName');
    }

    if (!product) {
      product = await Product.findOne({ userId, warrantyExpiryDate: { $ne: null } }).populate('receiptId', 'storeName');
    }

    const productName = product?.productName || 'Apple MacBook Pro M3 (Sample)';
    const storeName = product?.receiptId?.storeName || 'Official Apple Store';
    const expiryDate = product?.warrantyExpiryDate || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.max(1, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const html = renderWarrantyEmailHtml({
      userName: user?.name || 'Valued User',
      productName,
      storeName,
      warrantyExpiryDate: expiryDate,
      daysRemaining,
    });

    const subject = `[BillBox] Warranty Expiry Notice: ${productName} (${daysRemaining} days remaining)`;

    return sendSuccess(res, 200, 'Preview generated successfully', {
      subject,
      html,
      to: user?.email || 'user@example.com',
      productName,
      storeName,
      daysRemaining,
      expiryDate,
    });
  } catch (error) {
    console.error('previewWarrantyEmail error:', error);
    return sendError(res, 500, 'Failed to generate email preview');
  }
};

// POST /api/reminders/scan-now
// Allows authenticated users to immediately execute a warranty milestone check
const scanWarrantyNow = async (req, res) => {
  try {
    const results = await runWarrantyReminderCheck();
    return sendSuccess(res, 200, 'Warranty scan completed successfully', {
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('scanWarrantyNow error:', error);
    return sendError(res, 500, 'Failed to complete warranty scan');
  }
};

module.exports = {
  getReminders,
  updateReminderSettings,
  testSendReminder,
  sendTestAlert,
  triggerCronReminderCheck,
  previewWarrantyEmail,
  scanWarrantyNow,
};
