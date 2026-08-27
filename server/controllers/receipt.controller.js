const Receipt = require('../models/Receipt.model');
const Product = require('../models/Product.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { calculateWarrantyExpiryDate, calculateWarrantyStatus, parseFlexibleDate } = require('../services/warranty.service');
const { ensureUserCategory } = require('./category.controller');
const { runWarrantyReminderCheck } = require('../services/reminder.service');
const { logActivity } = require('../services/activity.service');

// GET /api/receipts
const getReceipts = async (req, res) => {
  try {
    const { category, status, warrantyStatus, search, year, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.userId };

    if (status) {
      filter.status = status;
    }

    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        filter.purchaseDate = {
          $gte: new Date(Date.UTC(yearNum, 0, 1)),
          $lt: new Date(Date.UTC(yearNum + 1, 0, 1)),
        };
      }
    }

    const hasCategory = category && category !== 'All';
    const hasWarrantyStatus = warrantyStatus && warrantyStatus !== 'All';
    const hasSearch = search && search.trim();

    // Filter by product category or search matching product fields
    let matchingReceiptIds = null;
    if (hasCategory || hasWarrantyStatus || hasSearch) {
      const prodFilter = { userId: req.userId };
      if (hasCategory) prodFilter.category = category;
      if (hasWarrantyStatus) prodFilter.warrantyStatus = warrantyStatus;
      if (hasSearch) {
        prodFilter.$or = [
          { productName: { $regex: search.trim(), $options: 'i' } },
          { brand: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const matchingProds = await Product.find(prodFilter).select('receiptId');
      matchingReceiptIds = matchingProds.map((p) => p.receiptId);

      if (hasSearch) {
        // Also search storeName / invoiceNumber on Receipt
        const matchingReceipts = await Receipt.find({
          userId: req.userId,
          $or: [
            { storeName: { $regex: search.trim(), $options: 'i' } },
            { invoiceNumber: { $regex: search.trim(), $options: 'i' } },
          ],
        }).select('_id');

        matchingReceiptIds = [
          ...matchingReceiptIds,
          ...matchingReceipts.map((r) => r._id),
        ];
      }

      filter._id = { $in: matchingReceiptIds };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .populate('products')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Receipt.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Receipts fetched', {
      receipts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('getReceipts error:', error);
    return sendError(res, 500, 'Server error fetching receipts.');
  }
};

// GET /api/receipts/:id
const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('products');

    if (!receipt) {
      return sendError(res, 404, 'Receipt not found.');
    }

    return sendSuccess(res, 200, 'Receipt fetched', { receipt });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return sendError(res, 404, 'Receipt not found.');
    }
    return sendError(res, 500, 'Server error fetching receipt.');
  }
};

// Helper to save products for a receipt
const saveProductsForReceipt = async (userId, receiptId, purchaseDate, itemsArray = []) => {
  const createdProducts = [];
  const itemsToProcess = Array.isArray(itemsArray) && itemsArray.length > 0
    ? itemsArray
    : [{ productName: 'Item 1', quantity: 1, category: 'Others' }];

  const FEE_ITEM_REGEX = /^(?:protect\s*promise|handling|convenience|platform|delivery|shipping|packaging|service|installation)\s*(?:fee|charges?|amount)?$/i;

  for (const item of itemsToProcess) {
    const prodName = (item.productName || item.name || '').trim();
    if (!prodName) continue;

    // Skip non-product fee/charge line items
    if (
      FEE_ITEM_REGEX.test(prodName) ||
      /protect\s*promise\s*fee|handling\s*fee|delivery\s*(?:fee|charge)|platform\s*fee|packaging\s*fee/i.test(prodName)
    ) {
      continue;
    }

    const category = item.category || 'Others';
    const periodValue = item.warrantyPeriodValue != null ? Number(item.warrantyPeriodValue) : null;
    const periodUnit = item.warrantyPeriodUnit || 'months';

    const warrantyExpiryDate = calculateWarrantyExpiryDate(purchaseDate, periodValue, periodUnit);
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
      receiptId,
      userId,
      productName: prodName,
      brand: item.brand || '',
      category,
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

    await ensureUserCategory(userId, category);
    createdProducts.push(product);
  }

  return createdProducts;
};

// POST /api/receipts
const createReceipt = async (req, res) => {
  try {
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
      fileUrl,
      fileType,
      ocrRaw,
      ocrConfidence,
      items,
      products,
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

    let fileData = req.body.fileData || null;
    let mimeType = req.body.mimeType || null;
    if (!fileData && fileUrl) {
      const rel = fileUrl.replace(/^\/uploads\//, '');
      const os = require('os');
      const candidatePaths = [
        path.join(__dirname, '../uploads', rel),
        path.join(os.tmpdir(), 'billbox_uploads', rel),
        path.join(os.tmpdir(), rel),
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          fileData = buf.toString('base64');
          const ext = path.extname(p).toLowerCase();
          if (ext === '.pdf') mimeType = 'application/pdf';
          else if (ext === '.png') mimeType = 'image/png';
          else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
          else if (ext === '.webp') mimeType = 'image/webp';
          break;
        }
      }
    }

    const normalizedFileType =
      fileType === 'pdf' ||
      mimeType === 'application/pdf' ||
      fileUrl?.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : fileType === 'manual'
        ? 'manual'
        : 'image';

    const receipt = await Receipt.create({
      userId: req.userId,
      fileUrl: fileUrl || null,
      fileData,
      mimeType,
      fileType: normalizedFileType,
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

    const createdProducts = await saveProductsForReceipt(req.userId, receipt._id, parsedPurchaseDate, itemsList);
    const populatedReceipt = receipt.toObject();
    populatedReceipt.products = createdProducts;

    // Log user activity
    logActivity({
      userId: req.userId,
      type: 'receipt_created',
      title: 'Receipt Created',
      message: `Added receipt from ${storeName || 'Merchant'} for ${finalGrandTotal != null ? `₹${finalGrandTotal}` : 'an unpriced bill'}`,
      refId: receipt._id,
      refModel: 'Receipt',
    });

    return sendSuccess(res, 201, 'Receipt saved', { receipt: populatedReceipt });
  } catch (error) {
    console.error('Create receipt error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return sendError(res, 400, 'Validation failed', errors);
    }
    return sendError(res, 500, 'Server error creating receipt.');
  }
};

// PUT /api/receipts/:id
const updateReceipt = async (req, res) => {
  try {
    const existing = await Receipt.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!existing) {
      return sendError(res, 404, 'Receipt not found.');
    }

    const purchaseDate = req.body.purchaseDate !== undefined ? parseFlexibleDate(req.body.purchaseDate) : existing.purchaseDate;
    const dueDate = req.body.dueDate !== undefined ? parseFlexibleDate(req.body.dueDate) : existing.dueDate;

    const finalGrandTotal = req.body.grandTotal !== undefined
      ? (req.body.grandTotal != null ? Number(req.body.grandTotal) : null)
      : (req.body.totalAmount !== undefined ? (req.body.totalAmount != null ? Number(req.body.totalAmount) : null) : existing.grandTotal);

    const updateFields = {
      ...req.body,
      purchaseDate,
      dueDate,
      grandTotal: finalGrandTotal,
      totalAmount: finalGrandTotal,
      updatedAt: new Date(),
    };

    const receipt = await Receipt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    // Update products if provided in request
    const itemsList = req.body.products || req.body.items;
    if (Array.isArray(itemsList)) {
      await Product.deleteMany({ receiptId: receipt._id });
      await saveProductsForReceipt(req.userId, receipt._id, purchaseDate, itemsList);
    }

    const updatedReceipt = await Receipt.findById(receipt._id).populate('products');

    return sendSuccess(res, 200, 'Receipt updated', { receipt: updatedReceipt });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return sendError(res, 404, 'Receipt not found.');
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return sendError(res, 400, 'Validation failed', errors);
    }
    return sendError(res, 500, 'Server error updating receipt.');
  }
};

// DELETE /api/receipts/:id
const deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!receipt) {
      return sendError(res, 404, 'Receipt not found.');
    }

    // Delete associated products
    await Product.deleteMany({ receiptId: receipt._id });

    logActivity({
      userId: req.userId,
      type: 'receipt_deleted',
      title: 'Receipt Deleted',
      message: `Deleted receipt from ${receipt.storeName || 'Merchant'}`,
      refId: receipt._id,
      refModel: 'Receipt',
    });

    return sendSuccess(res, 200, 'Receipt deleted', null);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return sendError(res, 404, 'Receipt not found.');
    }
    return sendError(res, 500, 'Server error deleting receipt.');
  }
};

// PATCH /api/receipts/:id/status
const updateReceiptStatus = async (req, res) => {
  try {
    const { status, resolvedNote } = req.body;

    const validStatuses = ['active', 'nearing_expiry', 'resolved', 'archived'];
    if (!status || !validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid or missing status value.');
    }

    if (status === 'resolved' && (!resolvedNote || !resolvedNote.trim())) {
      return sendError(res, 400, 'Resolved note is required when status is resolved.');
    }

    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'resolved') {
      updateData.resolvedNote = resolvedNote.trim();
    } else if (resolvedNote !== undefined) {
      updateData.resolvedNote = resolvedNote.trim();
    }

    const receipt = await Receipt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('products');

    if (!receipt) {
      return sendError(res, 404, 'Receipt not found.');
    }

    return sendSuccess(res, 200, 'Status updated', { receipt });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return sendError(res, 404, 'Receipt not found.');
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return sendError(res, 400, 'Validation failed', errors);
    }
    return sendError(res, 500, 'Server error updating status.');
  }
};

// POST /api/receipts/trigger-reminders
const triggerReminders = async (req, res) => {
  try {
    const result = await runWarrantyReminderCheck();
    return sendSuccess(res, 200, 'Warranty reminder check executed', result);
  } catch (error) {
    return sendError(res, 500, 'Error executing reminder check.');
  }
};

module.exports = {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  updateReceiptStatus,
  triggerReminders,
};
