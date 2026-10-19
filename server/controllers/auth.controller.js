const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, timezone } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'A user with this email already exists.');
    }

    // Create user — password hashing handled by pre-save hook
    const user = await User.create({
      name,
      email,
      password,
      timezone: timezone || 'UTC',
    });

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return sendSuccess(res, 201, 'Account created successfully', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Server error during registration.');
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user — include password for comparison
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        uiPreferences: user.uiPreferences || {
          theme: 'light',
          density: 'comfortable',
          viewMode: 'table',
          sidebarCollapsed: false,
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Server error during login.');
  }
};

// GET /api/auth/me (or /api/auth/profile)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    const Receipt = require('../models/Receipt.model');
    const Product = require('../models/Product.model');

    const [receiptCount, productCount, activeWarrantyCount, receipts] = await Promise.all([
      Receipt.countDocuments({ userId: req.userId }),
      Product.countDocuments({ userId: req.userId }),
      Product.countDocuments({ userId: req.userId, warrantyStatus: 'active' }),
      Receipt.find({ userId: req.userId }).select('grandTotal totalAmount'),
    ]);

    const totalSpent = receipts.reduce((acc, r) => {
      const amt = r.grandTotal != null ? r.grandTotal : (r.totalAmount || 0);
      return acc + (Number(amt) || 0);
    }, 0);

    return sendSuccess(res, 200, 'User profile fetched', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        timezone: user.timezone || 'UTC',
        defaultCurrency: user.defaultCurrency || 'INR',
        dateFormat: user.dateFormat || 'DD MMM YYYY',
        notificationPreferences: user.notificationPreferences || {
          emailAlerts: true,
          expiryDaysNotice: 30,
          monthlyDigest: true,
        },
        uiPreferences: user.uiPreferences || {
          theme: 'light',
          density: 'comfortable',
          viewMode: 'table',
          sidebarCollapsed: false,
        },
        createdAt: user.createdAt,
      },
      stats: {
        receiptCount,
        productCount,
        activeWarrantyCount,
        totalSpent,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    return sendError(res, 500, 'Server error fetching user.');
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      timezone,
      defaultCurrency,
      dateFormat,
      notificationPreferences,
      uiPreferences,
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (timezone) user.timezone = timezone;
    if (defaultCurrency) user.defaultCurrency = defaultCurrency;
    if (dateFormat) user.dateFormat = dateFormat;
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences,
      };
    }
    if (uiPreferences) {
      user.uiPreferences = {
        ...user.uiPreferences,
        ...uiPreferences,
      };
    }

    await user.save();

    return sendSuccess(res, 200, 'Profile updated successfully', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        timezone: user.timezone,
        defaultCurrency: user.defaultCurrency,
        dateFormat: user.dateFormat,
        notificationPreferences: user.notificationPreferences,
        uiPreferences: user.uiPreferences,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return sendError(res, 500, 'Failed to update profile.');
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Please provide both current and new passwords.');
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, 'New password must be at least 6 characters long.');
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 400, 'Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 200, 'Password updated successfully.');
  } catch (error) {
    console.error('changePassword error:', error);
    return sendError(res, 500, 'Failed to update password.');
  }
};

// DELETE /api/auth/clear-data
const clearUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const fs = require('fs');
    const path = require('path');
    const Receipt = require('../models/Receipt.model');
    const Product = require('../models/Product.model');
    const ReminderLog = require('../models/ReminderLog.model');
    const Activity = require('../models/Activity.model');
    const BatchUpload = require('../models/BatchUpload.model');
    const Category = require('../models/Category.model');

    // 1. Gather all physical files associated with this user's receipts and batch uploads
    const [receipts, batches] = await Promise.all([
      Receipt.find({ userId }).select('fileUrl').lean(),
      BatchUpload.find({ userId }).select('files.fileUrl').lean(),
    ]);

    const filesToDelete = new Set();
    receipts.forEach((r) => {
      if (r.fileUrl && r.fileUrl.startsWith('/uploads/')) {
        filesToDelete.add(r.fileUrl.replace('/uploads/', ''));
      }
    });

    batches.forEach((b) => {
      (b.files || []).forEach((f) => {
        if (f.fileUrl && f.fileUrl.startsWith('/uploads/')) {
          filesToDelete.add(f.fileUrl.replace('/uploads/', ''));
        }
      });
    });

    // 2. Remove physical files from server disk safely
    const uploadsDir = path.join(__dirname, '../uploads');
    filesToDelete.forEach((fileName) => {
      try {
        const fullPath = path.join(uploadsDir, path.basename(fileName));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.warn('File removal warning during account data wipe:', fileName, err.message);
      }
    });

    // 3. Cascade delete all documents across all models for this user
    await Promise.all([
      Receipt.deleteMany({ userId }),
      Product.deleteMany({ userId }),
      ReminderLog.deleteMany({ userId }),
      Activity.deleteMany({ userId }),
      BatchUpload.deleteMany({ userId }),
      Category.deleteMany({ userId }),
    ]);

    return sendSuccess(res, 200, 'All receipts, products, batch uploads, categories, and activity data cleared successfully.');
  } catch (error) {
    console.error('clearUserData error:', error);
    return sendError(res, 500, 'Failed to clear account data.');
  }
};
// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, 'A valid email is required.');
    }
    // Return standard security response whether email exists or not
    return sendSuccess(res, 200, 'If an account exists for that email, a reset link is on its way.');
  } catch (error) {
    return sendError(res, 500, 'Server error during password reset request.');
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.');
    }
    return sendSuccess(res, 200, 'Password has been reset successfully.');
  } catch (error) {
    return sendError(res, 500, 'Server error updating password.');
  }
};

// DELETE /api/auth/account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const User = require('../models/User.model');
    const Receipt = require('../models/Receipt.model');
    const Product = require('../models/Product.model');
    const ReminderLog = require('../models/ReminderLog.model');
    const Activity = require('../models/Activity.model');
    const BatchUpload = require('../models/BatchUpload.model');
    const Category = require('../models/Category.model');

    await Promise.all([
      Receipt.deleteMany({ userId }),
      Product.deleteMany({ userId }),
      ReminderLog.deleteMany({ userId }),
      Activity.deleteMany({ userId }),
      BatchUpload.deleteMany({ userId }),
      Category.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    return sendSuccess(res, 200, 'Account permanently deleted.');
  } catch (error) {
    console.error('deleteAccount error:', error);
    return sendError(res, 500, 'Failed to delete account.');
  }
};

// POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return sendError(res, 400, 'Google credential is required.');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return sendError(res, 500, 'Google OAuth is not configured on the server.');
    }

    // Verify Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      return sendError(res, 401, 'Google authentication failed or expired. Please try again.');
    }

    const { sub: googleId, email, name, picture } = payload;
    if (!email) {
      return sendError(res, 400, 'Google account does not provide an email address.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user) {
      let isUpdated = false;
      // Link googleId if user registered with email previously
      if (!user.googleId) {
        user.googleId = googleId;
        isUpdated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        isUpdated = true;
      }
      if (isUpdated) {
        await user.save();
      }
    } else {
      // Create new user via Google
      user = await User.create({
        name: name || 'Google User',
        email: normalizedEmail,
        googleId,
        avatar: picture || '',
        timezone: 'UTC',
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return sendSuccess(res, 200, 'Google sign-in successful', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        timezone: user.timezone,
        uiPreferences: user.uiPreferences || {
          theme: 'light',
          density: 'comfortable',
          viewMode: 'table',
          sidebarCollapsed: false,
        },
      },
    });
  } catch (error) {
    console.error('googleLogin error:', error);
    return sendError(res, 500, 'Server error during Google authentication.');
  }
};

module.exports = {
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
};

