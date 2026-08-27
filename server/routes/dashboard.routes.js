const express = require('express');
const auth = require('../middleware/auth.middleware');
const {
  getStats,
  getWarrantyTimeline,
  getRecentActivity,
} = require('../controllers/dashboard.controller');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/dashboard/stats
router.get('/stats', getStats);

// GET /api/dashboard/warranty-timeline
router.get('/warranty-timeline', getWarrantyTimeline);

// GET /api/dashboard/activity
router.get('/activity', getRecentActivity);

module.exports = router;
