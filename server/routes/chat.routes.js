const express = require('express');
const { ask, getSuggestions } = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

// Require authentication for all Ask BillBox AI endpoints
router.use(auth);

// POST /api/chat/ask
router.post('/ask', ask);

// GET /api/chat/suggestions
router.get('/suggestions', getSuggestions);

module.exports = router;
