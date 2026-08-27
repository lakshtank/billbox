const mongoose = require('mongoose');
const crypto = require('crypto');

const receiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    publicToken: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomUUID(),
      index: true,
    },

    // File Reference
    fileUrl: { type: String, default: null },
    fileType: {
      type: String,
      enum: ['image', 'pdf', 'manual'],
      required: true,
    },

    // Receipt-level Metadata
    storeName: { type: String, default: '', trim: true },
    invoiceNumber: { type: String, default: '', trim: true },
    purchaseDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },

    // Financial Breakdown
    subtotal: { type: Number, default: null },
    discountAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    shippingAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: null },
    totalAmount: { type: Number, default: null }, // Kept for backward compatibility
    currency: { type: String, default: 'INR' },

    notes: { type: String, default: '' },

    // Validation / Flagging
    needsReview: { type: Boolean, default: false },

    // Lifecycle Status
    status: {
      type: String,
      enum: ['active', 'nearing_expiry', 'resolved', 'archived'],
      default: 'active',
    },
    resolvedNote: { type: String, default: '' },

    // OCR Metadata
    ocrRaw: { type: String, default: '' },
    ocrConfidence: {
      storeName: { type: Number, default: null },
      invoiceNumber: { type: Number, default: null },
      purchaseDate: { type: Number, default: null },
      subtotal: { type: Number, default: null },
      grandTotal: { type: Number, default: null },
      totalAmount: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual populate for products
receiptSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'receiptId',
});

module.exports = mongoose.models.Receipt || mongoose.model('Receipt', receiptSchema);
