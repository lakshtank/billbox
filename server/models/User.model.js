const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  defaultCurrency: {
    type: String,
    default: 'INR',
  },
  dateFormat: {
    type: String,
    default: 'DD MMM YYYY',
  },
  notificationPreferences: {
    emailAlerts: { type: Boolean, default: true },
    expiryDaysNotice: { type: Number, default: 30 },
    monthlyDigest: { type: Boolean, default: true },
  },
  uiPreferences: {
    theme: { type: String, enum: ['light', 'gentle', 'dark', 'system'], default: 'light' },
    density: { type: String, enum: ['comfortable', 'compact'], default: 'comfortable' },
    viewMode: { type: String, enum: ['table', 'grid'], default: 'table' },
    sidebarCollapsed: { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
});

// Hash password before saving — never in the controller
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method for password comparison
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
