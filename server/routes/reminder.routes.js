const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  getReminders,
  updateReminderSettings,
  testSendReminder,
  sendTestAlert,
  triggerCronReminderCheck,
  previewWarrantyEmail,
  scanWarrantyNow,
} = require('../controllers/reminder.controller');

// External/Vercel Cron webhook endpoint (protected via CRON_SECRET)
// Placed before user auth middleware so serverless schedulers can trigger it
router.get('/cron-check', triggerCronReminderCheck);
router.post('/cron-check', triggerCronReminderCheck);

// All subsequent user reminder routes are protected by user auth middleware
router.use(auth);

// GET /api/reminders
router.get('/', getReminders);

// POST /api/reminders/scan-now
router.post('/scan-now', scanWarrantyNow);

// GET /api/reminders/preview-email/:productId
router.get('/preview-email/:productId', previewWarrantyEmail);

// POST /api/reminders/test-alert
router.post('/test-alert', sendTestAlert);

// PATCH /api/reminders/:productId
router.patch('/:productId', updateReminderSettings);

// POST /api/reminders/:productId/test
router.post('/:productId/test', testSendReminder);

module.exports = router;
