const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  changePassword,
  clearUserData,
  deleteAccount,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
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

// POST /api/auth/google
router.post(
  '/google',
  [body('credential').notEmpty().withMessage('Google credential is required.')],
  validate,
  googleLogin
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('A valid email is required.')],
  validate,
  forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  resetPassword
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

// DELETE /api/auth/account
router.delete('/account', auth, deleteAccount);

module.exports = router;
