const path = require('path');
const fs = require('fs');
const Receipt = require('../models/receipt.model');
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

    const receipt = await Receipt.findOne({ publicToken }).select('fileUrl storeName publicToken');
    if (!receipt || !receipt.fileUrl) {
      return sendError(res, 404, 'File not found for this receipt.');
    }

    // Sanitize file path
    const relativePath = receipt.fileUrl.replace(/^\/uploads\//, '');
    const absolutePath = path.join(__dirname, '../uploads', relativePath);

    if (!fs.existsSync(absolutePath)) {
      return sendError(res, 404, 'File physically missing on server.');
    }

    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';

    const safeVendor = (receipt.storeName || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeVendor}${ext}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    return res.sendFile(absolutePath);
  } catch (error) {
    console.error('getPublicReceiptFile error:', error);
    return sendError(res, 500, 'Server error serving public receipt file.');
  }
};

module.exports = {
  getPublicReceipt,
  getPublicReceiptFile,
};
