const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
      required: false,
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Others',
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    originalUnitPrice: {
      type: Number,
      default: null,
    },
    unitPrice: {
      type: Number,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    lineTotal: {
      type: Number,
      default: null,
    },

    // Per-Product Warranty
    warrantyPeriodValue: {
      type: Number,
      default: null,
    },
    warrantyPeriodUnit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'months',
    },
    warrantyPeriodMonths: {
      type: Number,
      default: null,
    },
    warrantyExpiryDate: {
      type: Date,
      default: null,
    },
    warrantyStatus: {
      type: String,
      enum: ['none', 'active', 'expiring_soon', 'expired'],
      default: 'none',
      index: true,
    },

    // Per-Product Warranty Reminders Configuration & Sent Tracking
    reminderEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    reminderLeadDays: {
      type: Number,
      default: 30,
    },
    remindersSent: {
      days30: { type: Boolean, default: false },
      days15: { type: Boolean, default: false },
      days7: { type: Boolean, default: false },
      days1: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
