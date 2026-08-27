const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  getReminders,
  updateReminderSettings,
  testSendReminder,
  sendTestAlert,
} = require('../controllers/reminder.controller');

// All reminder routes are protected
router.use(auth);

// GET /api/reminders
router.get('/', getReminders);

// POST /api/reminders/test-alert
router.post('/test-alert', sendTestAlert);

// PATCH /api/reminders/:productId
router.patch('/:productId', updateReminderSettings);

// POST /api/reminders/:productId/test
router.post('/:productId/test', testSendReminder);

module.exports = router;
