const mongoose = require('mongoose');

const batchUploadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    files: [
      {
        originalName: { type: String, required: true },
        fileUrl: { type: String, default: '' },
        fileType: { type: String, enum: ['image', 'pdf'], default: 'image' },
        status: {
          type: String,
          enum: ['queued', 'processing', 'needs_review', 'saved', 'failed'],
          default: 'queued',
        },
        errorMessage: { type: String, default: '' },
        receiptId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Receipt',
          default: null,
        },
        ocrResult: { type: Object, default: null },
      },
    ],
    totalFiles: { type: Number, required: true },
    completedFiles: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('BatchUpload', batchUploadSchema);
