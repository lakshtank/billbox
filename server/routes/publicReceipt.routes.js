const express = require('express');
const { getPublicReceipt, getPublicReceiptFile } = require('../controllers/publicReceipt.controller');

const router = express.Router();

// PUBLIC routes - NO authentication middleware
router.get('/:publicToken/file', getPublicReceiptFile);
router.get('/:publicToken', getPublicReceipt);

module.exports = router;
