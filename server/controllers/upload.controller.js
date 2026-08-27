const path = require('path');
const fs = require('fs');
const BatchUpload = require('../models/BatchUpload.model');
const Receipt = require('../models/Receipt.model');
const Product = require('../models/Product.model');
const { runOCR } = require('../services/ocr.service');
const { extractFields } = require('../services/fieldExtractor.service');
const { calculateWarrantyExpiryDate, calculateWarrantyStatus, parseFlexibleDate } = require('../services/warranty.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const { getUserCategoryNames, ensureUserCategory } = require('./category.controller');

// POST /api/upload/single
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No receipt file attached.');
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const isPdf = mimeType === 'application/pdf';
    const fileType = isPdf ? 'pdf' : 'image';

    // Construct relative file URL for client access
    const fileUrl = `/uploads/${req.file.filename}`;

    // Read file buffer for cloud persistence in MongoDB Atlas
    let fileData = null;
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      fileData = fileBuffer.toString('base64');
    }

    // Stage 1: Run OCR runner
    const { rawText, wordData } = await runOCR(filePath, mimeType);

    // Fetch user categories to guide Gemini classification
    const userCategories = await getUserCategoryNames(req.userId);

    // Stage 2: Extract structured fields & confidence scores
    const { extracted, handwritingDetected } = extractFields(rawText, wordData, userCategories);

    return sendSuccess(res, 200, 'File uploaded and OCR processed', {
      fileUrl,
      fileType,
      fileData,
      mimeType,
      extracted,
      ocrRaw: rawText,
      handwritingDetected,
    });
  } catch (error) {
    console.error('Upload single error:', error);
    return sendError(
      res,
      500,
      `OCR processing error: ${error.message || 'Failed to process receipt'}`
    );
  }
};

// Sequential background processing function for batch upload (Section 7.5: One file at a time)
const processBatchFilesSequentially = async (batchId, files) => {
  const batchDoc = await BatchUpload.findById(batchId).select('userId').lean();
  const userCategories = batchDoc ? await getUserCategoryNames(batchDoc.userId) : [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Set file status to processing
      await BatchUpload.updateOne(
        { _id: batchId, 'files._id': file.dbFileId },
        { $set: { 'files.$.status': 'processing' } }
      );

      // Run OCR & Field extraction
      const { rawText, wordData } = await runOCR(file.path, file.mimetype);
      const { extracted, handwritingDetected, isNonReceipt, lowConfidenceWarning } = extractFields(rawText, wordData, userCategories);

      // If zero text or no readable words extracted at all, fail the file gracefully
      const isZeroText = !rawText || rawText.trim().length < 3;
      if (isZeroText) {
        await BatchUpload.updateOne(
          { _id: batchId, 'files._id': file.dbFileId },
          {
            $set: {
              'files.$.status': 'failed',
              'files.$.errorMessage': 'Non-receipt image or no readable text detected',
            },
            $inc: { completedFiles: 1 },
          }
        );
        continue;
      }

      // Update file status to needs_review and store OCR result
      await BatchUpload.updateOne(
        { _id: batchId, 'files._id': file.dbFileId },
        {
          $set: {
            'files.$.status': 'needs_review',
            'files.$.ocrResult': {
              extracted,
              ocrRaw: rawText,
              handwritingDetected,
              isNonReceipt,
              lowConfidenceWarning: lowConfidenceWarning || isNonReceipt,
            },
          },
          $inc: { completedFiles: 1 },
        }
      );
    } catch (err) {
      console.error(`Batch processing error for file ${file.originalName}:`, err.message);
      // Mark file as failed
      await BatchUpload.updateOne(
        { _id: batchId, 'files._id': file.dbFileId },
        {
          $set: {
            'files.$.status': 'failed',
            'files.$.errorMessage': err.message || 'OCR processing failed',
          },
          $inc: { completedFiles: 1 },
        }
      );
    }
  }
};

// POST /api/upload/batch
const uploadBatch = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'No receipt files attached for batch upload.');
    }

    if (req.files.length > 5) {
      return sendError(res, 400, 'Maximum of 5 receipt files allowed per batch upload.');
    }

    const fileEntries = req.files.map((file) => {
      const isPdf = file.mimetype === 'application/pdf';
      return {
        originalName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileType: isPdf ? 'pdf' : 'image',
        status: 'queued',
        errorMessage: '',
        receiptId: null,
        ocrResult: null,
      };
    });

    const batchDoc = await BatchUpload.create({
      userId: req.userId,
      files: fileEntries,
      totalFiles: req.files.length,
      completedFiles: 0,
    });

    // Map files for sequential processing runner
    const filesToProcess = req.files.map((file, idx) => ({
      dbFileId: batchDoc.files[idx]._id,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
    }));

    // Start background sequential processing (non-blocking)
    processBatchFilesSequentially(batchDoc._id, filesToProcess);

    return sendSuccess(res, 200, 'Batch upload started', {
      batchId: batchDoc._id,
      totalFiles: batchDoc.totalFiles,
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    return sendError(res, 500, 'Server error starting batch upload.');
  }
};

// GET /api/upload/batch/:batchId
const getBatchStatus = async (req, res) => {
  try {
    const batchDoc = await BatchUpload.findOne({
      _id: req.params.batchId,
      userId: req.userId,
    });

    if (!batchDoc) {
      return sendError(res, 404, 'Batch upload process not found.');
    }

    return sendSuccess(res, 200, 'Batch status fetched', {
      batchId: batchDoc._id,
      totalFiles: batchDoc.totalFiles,
      completedFiles: batchDoc.completedFiles,
      files: batchDoc.files,
      createdAt: batchDoc.createdAt,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return sendError(res, 404, 'Batch upload process not found.');
    }
    return sendError(res, 500, 'Server error fetching batch status.');
  }
};

// POST /api/upload/batch/:batchId/files/:fileIndex/save
const saveBatchFile = async (req, res) => {
  try {
    const { batchId, fileIndex } = req.params;
    const idx = parseInt(fileIndex, 10);

    const batchDoc = await BatchUpload.findOne({
      _id: batchId,
      userId: req.userId,
    });

    if (!batchDoc) {
      return sendError(res, 404, 'Batch upload not found.');
    }

    if (isNaN(idx) || idx < 0 || idx >= batchDoc.files.length) {
      return sendError(res, 400, 'Invalid file index in batch.');
    }

    const batchFile = batchDoc.files[idx];
    if (batchFile.status === 'saved' && batchFile.receiptId) {
      const existingReceipt = await Receipt.findOne({ _id: batchFile.receiptId, userId: req.userId });
      if (existingReceipt) {
        return sendSuccess(res, 200, 'Receipt already saved', { receipt: existingReceipt });
      }
    }

    const {
      storeName,
      invoiceNumber,
      purchaseDate,
      dueDate,
      subtotal,
      discountAmount,
      discountPercent,
      shippingAmount,
      taxAmount,
      grandTotal,
      totalAmount,
      currency,
      notes,
      ocrRaw,
      ocrConfidence,
      items,
      products,
      productName,
      brand,
      category,
      serialNumber,
      warrantyPeriodValue,
      warrantyPeriodUnit,
    } = req.body;

    const parsedPurchaseDate = parseFlexibleDate(purchaseDate) || new Date();
    const parsedDueDate = parseFlexibleDate(dueDate);
    const finalGrandTotal = grandTotal != null ? Number(grandTotal) : (totalAmount != null ? Number(totalAmount) : null);
    const itemsList = Array.isArray(products) && products.length > 0 ? products : (Array.isArray(items) ? items : []);

    // Calculate line total vs grand total validation mismatch
    const sumLineTotals = itemsList.reduce((acc, item) => acc + (Number(item.lineTotal || item.unitPrice || 0)), 0);
    const grandVal = finalGrandTotal != null ? Number(finalGrandTotal) : null;
    const subVal = subtotal != null ? Number(subtotal) : null;
    const taxVal = Number(taxAmount || 0);
    const shipVal = Number(shippingAmount || 0);
    const discVal = Number(discountAmount || 0);

    const matchesGrand = grandVal != null && Math.abs(sumLineTotals - grandVal) <= 1.00;
    const matchesSub = subVal != null && Math.abs(sumLineTotals - subVal) <= 1.00;
    const matchesReconciled = grandVal != null && Math.abs((sumLineTotals - discVal + taxVal + shipVal) - grandVal) <= 1.00;

    const needsReview = itemsList.length > 0 && grandVal != null && !matchesGrand && !matchesSub && !matchesReconciled;

    const receipt = await Receipt.create({
      userId: req.userId,
      fileUrl: batchFile.fileUrl || null,
      fileType: batchFile.fileType || 'image',
      storeName: storeName || '',
      invoiceNumber: invoiceNumber || '',
      purchaseDate: parsedPurchaseDate,
      dueDate: parsedDueDate,
      subtotal: subtotal != null ? Number(subtotal) : null,
      discountAmount: discountAmount != null ? Number(discountAmount) : 0,
      discountPercent: discountPercent != null ? Number(discountPercent) : 0,
      shippingAmount: shippingAmount != null ? Number(shippingAmount) : 0,
      taxAmount: taxAmount != null ? Number(taxAmount) : 0,
      grandTotal: finalGrandTotal,
      totalAmount: finalGrandTotal,
      currency: currency || 'INR',
      notes: notes || '',
      needsReview,
      ocrRaw: ocrRaw || '',
      ocrConfidence: ocrConfidence || {},
    });

    // Create Product documents
    const createdProducts = [];
    const itemsToProcess = itemsList.length > 0
      ? itemsList
      : [{ productName: productName || batchFile.originalName || 'Item 1', brand, category, quantity: 1, unitPrice: finalGrandTotal, lineTotal: finalGrandTotal }];

    for (const item of itemsToProcess) {
      const prodName = (item.productName || item.name || 'Item').trim();
      if (!prodName) continue;

      const itemCategory = item.category || category || 'Others';
      const periodValue = item.warrantyPeriodValue != null ? Number(item.warrantyPeriodValue) : (warrantyPeriodValue != null ? Number(warrantyPeriodValue) : null);
      const periodUnit = item.warrantyPeriodUnit || warrantyPeriodUnit || 'months';

      const warrantyExpiryDate = calculateWarrantyExpiryDate(parsedPurchaseDate, periodValue, periodUnit);
      const warrantyStatus = calculateWarrantyStatus(warrantyExpiryDate);

      let periodMonths =
        periodValue != null
          ? periodUnit === 'years'
            ? periodValue * 12
            : periodUnit === 'weeks'
            ? Math.round(periodValue / 4)
            : periodUnit === 'days'
            ? Math.round(periodValue / 30)
            : periodValue
          : null;

      const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      const lineTot = item.lineTotal != null ? Number(item.lineTotal) : (item.unitPrice != null ? Number(item.unitPrice) * qty : null);
      const origUnitPrice = item.originalUnitPrice != null ? Number(item.originalUnitPrice) : (item.unitPrice != null ? Number(item.unitPrice) : null);
      const discAmt = item.discountAmount != null ? Number(item.discountAmount) : 0;
      const discPct = item.discountPercent != null ? Number(item.discountPercent) : 0;

      const product = await Product.create({
        receiptId: receipt._id,
        userId: req.userId,
        productName: prodName,
        brand: item.brand || brand || '',
        category: itemCategory,
        quantity: qty,
        originalUnitPrice: origUnitPrice,
        unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
        discountAmount: discAmt,
        discountPercent: discPct,
        lineTotal: lineTot,
        warrantyPeriodValue: periodValue,
        warrantyPeriodUnit: periodUnit,
        warrantyPeriodMonths: periodMonths,
        warrantyExpiryDate,
        warrantyStatus,
      });

      await ensureUserCategory(req.userId, itemCategory);
      createdProducts.push(product);
    }

    // Update batch file entry
    batchFile.status = 'saved';
    batchFile.receiptId = receipt._id;
    await batchDoc.save();

    const populatedReceipt = receipt.toObject();
    populatedReceipt.products = createdProducts;

    return sendSuccess(res, 201, 'Batch receipt saved successfully', { receipt: populatedReceipt });
  } catch (error) {
    console.error('Save batch file error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return sendError(res, 400, 'Validation failed', errors);
    }
    return sendError(res, 500, 'Server error saving batch receipt.');
  }
};

module.exports = {
  uploadSingle,
  uploadBatch,
  getBatchStatus,
  saveBatchFile,
};
