const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, changePassword, clearUserData } = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').trim().isEmail().withMessage('A valid email is required.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

// GET /api/auth/me and GET /api/auth/profile
router.get('/me', auth, getMe);
router.get('/profile', auth, getMe);

// PUT /api/auth/profile
router.put('/profile', auth, updateProfile);

// PUT /api/auth/change-password
router.put('/change-password', auth, changePassword);

// DELETE /api/auth/clear-data
router.delete('/clear-data', auth, clearUserData);

module.exports = router;
