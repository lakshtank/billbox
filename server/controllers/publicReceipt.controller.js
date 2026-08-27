const path = require('path');
const fs = require('fs');
const Receipt = require('../models/Receipt.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/public/receipts/:publicToken
const getPublicReceipt = async (req, res) => {
  try {
    const { publicToken } = req.params;
    if (!publicToken) {
      return sendError(res, 400, 'Public token is required.');
    }

    const receipt = await Receipt.findOne({ publicToken })
      .select('storeName invoiceNumber purchaseDate grandTotal totalAmount currency fileUrl fileType publicToken')
      .populate('products', 'productName brand category quantity unitPrice lineTotal');

    if (!receipt) {
      return sendError(res, 404, 'This link is invalid or has expired.');
    }

    return sendSuccess(res, 200, 'Public receipt retrieved', { receipt });
  } catch (error) {
    console.error('getPublicReceipt error:', error);
    return sendError(res, 500, 'Server error fetching public receipt.');
  }
};

// GET /api/public/receipts/:publicToken/file
const getPublicReceiptFile = async (req, res) => {
  try {
    const { publicToken } = req.params;
    if (!publicToken) {
      return sendError(res, 400, 'Public token is required.');
    }

    const receipt = await Receipt.findOne({ publicToken })
      .select(
        'fileUrl fileData mimeType fileType storeName publicToken invoiceNumber purchaseDate grandTotal totalAmount currency'
      )
      .populate('products', 'productName brand category quantity unitPrice lineTotal');

    if (!receipt) {
      return sendError(res, 404, 'Receipt not found.');
    }

    const safeVendor = (receipt.storeName || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. If exact original file data is stored in MongoDB Atlas, stream the original file
    if (receipt.fileData) {
      const buffer = Buffer.from(receipt.fileData, 'base64');
      const isPdf =
        receipt.fileType === 'pdf' ||
        receipt.mimeType === 'application/pdf' ||
        receipt.fileUrl?.toLowerCase().includes('.pdf');
      const ext = isPdf
        ? '.pdf'
        : receipt.mimeType?.includes('png')
        ? '.png'
        : '.jpg';
      const contentType =
        receipt.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${safeVendor}${ext}"`);
      return res.send(buffer);
    }

    // 2. Check if physical file exists on disk (standalone server)
    let absolutePath = null;
    if (receipt.fileUrl) {
      const relativePath = receipt.fileUrl.replace(/^\/uploads\//, '');
      const candidatePath = path.join(__dirname, '../uploads', relativePath);
      if (fs.existsSync(candidatePath)) {
        absolutePath = candidatePath;
      }
    }

    if (absolutePath) {
      const ext = path.extname(absolutePath).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.webp') contentType = 'image/webp';

      const fileName = `${safeVendor}${ext}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

      return res.sendFile(absolutePath);
    }

    return sendError(res, 404, 'Original document file is not available for this receipt.');
  } catch (error) {
    console.error('getPublicReceiptFile error:', error);
    return sendError(res, 500, 'Server error serving public receipt file.');
  }
};

module.exports = {
  getPublicReceipt,
  getPublicReceiptFile,
};
