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

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const generateReceiptPdf = async (receipt) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 50;

  // Header Banner
  page.drawRectangle({
    x: 40,
    y: y - 35,
    width: width - 80,
    height: 45,
    color: rgb(0.02, 0.59, 0.41),
  });

  page.drawText('BillBox Verified Receipt', {
    x: 55,
    y: y - 22,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= 65;

  // Merchant Information
  page.drawText(`Merchant: ${receipt.storeName || 'Verified Merchant'}`, {
    x: 40,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  y -= 20;

  if (receipt.invoiceNumber) {
    page.drawText(`Invoice #: ${receipt.invoiceNumber}`, {
      x: 40,
      y,
      size: 10,
      font,
      color: rgb(0.28, 0.33, 0.41),
    });
    y -= 16;
  }

  const dateStr = receipt.purchaseDate
    ? new Date(receipt.purchaseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  page.drawText(`Date: ${dateStr}`, {
    x: 40,
    y,
    size: 10,
    font,
    color: rgb(0.28, 0.33, 0.41),
  });
  y -= 25;

  // Table Line
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: rgb(0.89, 0.91, 0.94),
  });
  y -= 15;

  page.drawText('Item Description', { x: 40, y, size: 9, font: fontBold, color: rgb(0.28, 0.33, 0.41) });
  page.drawText('Qty', { x: 380, y, size: 9, font: fontBold, color: rgb(0.28, 0.33, 0.41) });
  page.drawText('Amount', { x: 480, y, size: 9, font: fontBold, color: rgb(0.28, 0.33, 0.41) });
  y -= 8;

  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: rgb(0.89, 0.91, 0.94),
  });
  y -= 18;

  const products = receipt.products || [];
  for (const item of products) {
    const name = (item.productName || 'Line Item').substring(0, 42);
    page.drawText(name, { x: 40, y, size: 9, font, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(String(item.quantity || 1), { x: 380, y, size: 9, font, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(`${receipt.currency || 'INR'} ${item.lineTotal || item.unitPrice || 0}`, {
      x: 480,
      y,
      size: 9,
      font,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 16;
  }

  if (products.length === 0) {
    page.drawText('Receipt Document Purchase', { x: 40, y, size: 9, font, color: rgb(0.06, 0.09, 0.16) });
    page.drawText('1', { x: 380, y, size: 9, font, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(`${receipt.currency || 'INR'} ${receipt.grandTotal || receipt.totalAmount || 0}`, {
      x: 480,
      y,
      size: 9,
      font,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 16;
  }

  y -= 10;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: rgb(0.89, 0.91, 0.94),
  });
  y -= 25;

  const total = receipt.grandTotal || receipt.totalAmount || 0;
  page.drawText(`Grand Total: ${receipt.currency || 'INR'} ${total}`, {
    x: 360,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.02, 0.59, 0.41),
  });

  return await pdfDoc.save();
};

// GET /api/public/receipts/:publicToken/file
const getPublicReceiptFile = async (req, res) => {
  try {
    const { publicToken } = req.params;
    if (!publicToken) {
      return sendError(res, 400, 'Public token is required.');
    }

    const receipt = await Receipt.findOne({ publicToken })
      .select('fileUrl storeName publicToken invoiceNumber purchaseDate grandTotal totalAmount currency')
      .populate('products', 'productName brand category quantity unitPrice lineTotal');

    if (!receipt) {
      return sendError(res, 404, 'Receipt not found.');
    }

    // Check if physical file exists on disk
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

      const safeVendor = (receipt.storeName || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeVendor}${ext}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

      return res.sendFile(absolutePath);
    }

    // Fallback for cloud/serverless environments where ephemeral disk is fresh:
    // Generate clean PDF directly from MongoDB record
    const pdfBytes = await generateReceiptPdf(receipt);
    const safeVendor = (receipt.storeName || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeVendor}_receipt.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('getPublicReceiptFile error:', error);
    return sendError(res, 500, 'Server error serving public receipt file.');
  }
};

module.exports = {
  getPublicReceipt,
  getPublicReceiptFile,
};
