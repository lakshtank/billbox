const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  updateReceiptStatus,
  triggerReminders,
} = require('../controllers/receipt.controller');

const router = express.Router();

// All routes require authentication
router.use(auth);

const receiptValidation = [
  body('purchaseDate')
    .optional()
    .notEmpty()
    .withMessage('Purchase date cannot be empty if provided.'),
  body('grandTotal')
    .optional({ values: 'null' })
    .isNumeric()
    .withMessage('Grand total must be a number.'),
  body('products')
    .optional()
    .isArray()
    .withMessage('Products must be an array.'),
];

const updateValidation = [
  body('grandTotal')
    .optional({ values: 'null' })
    .isNumeric()
    .withMessage('Grand total must be a number.'),
  body('products')
    .optional()
    .isArray()
    .withMessage('Products must be an array.'),
];

const statusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['active', 'nearing_expiry', 'resolved', 'archived'])
    .withMessage('Invalid status value.'),
  body('resolvedNote')
    .optional({ values: 'null' })
    .trim(),
];

// GET /api/receipts
router.get('/', getReceipts);

// POST /api/receipts/trigger-reminders (Manual trigger for testing)
router.post('/trigger-reminders', triggerReminders);

// GET /api/receipts/:id
router.get('/:id', getReceiptById);

// POST /api/receipts
router.post('/', receiptValidation, validate, createReceipt);

// PUT /api/receipts/:id
router.put('/:id', updateValidation, validate, updateReceipt);

// PATCH /api/receipts/:id/status
router.patch('/:id/status', statusValidation, validate, updateReceiptStatus);

// DELETE /api/receipts/:id
router.delete('/:id', deleteReceipt);

module.exports = router;
