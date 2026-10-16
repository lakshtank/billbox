const path = require('path');
const fs = require('fs');
const os = require('os');
const mongoose = require('mongoose');
const Receipt = require('../models/Receipt.model');
const Product = require('../models/Product.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { calculateWarrantyExpiryDate, calculateWarrantyStatus, parseFlexibleDate } = require('../services/warranty.service');
const { ensureUserCategory } = require('./category.controller');
const { runWarrantyReminderCheck } = require('../services/reminder.service');
const { logActivity } = require('../services/activity.service');

// Helper to remove local uploaded file when receipt is deleted
const deleteFileIfLocal = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  try {
    const rel = fileUrl.replace(/^\/uploads\//, '');
    const fullPath = path.join(__dirname, '../uploads', rel);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn(`[FileCleanup] Could not remove file: ${fileUrl}`, err.message);
  }
};

// GET /api/receipts
const getReceipts = async (req, res) => {
  try {
    const {
      category,
      status,
      warrantyStatus,
      search,
      year,
      page = 1,
      limit = 10,
      sortBy = 'date-desc',
    } = req.query;
    const filter = { userId: req.userId };

    if (status) {
      if (status === 'needs_review') {
        filter.needsReview = true;
      } else if (status === 'reconciled' || status === 'matched') {
        filter.needsReview = false;
      } else {
        filter.status = status;
      }
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

    const catList = category && category !== 'All'
      ? (Array.isArray(category)
          ? category
          : typeof category === 'string'
          ? category.split(',').map((c) => c.trim()).filter((c) => c && c !== 'All')
          : [])
      : [];
    const hasCategory = catList.length > 0;
    const hasWarrantyStatus = warrantyStatus && warrantyStatus !== 'All';
    const hasSearch = search && search.trim();

    // Filter by product category or search matching product fields
    let matchingReceiptIds = null;
    if (hasCategory || hasWarrantyStatus || hasSearch) {
      const prodFilter = { userId: req.userId };
      if (hasCategory) {
        prodFilter.category = catList.length === 1 ? catList[0] : { $in: catList };
      }
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
    const maxLimitAllowed = limit === 'all' || parseInt(limit, 10) > 100 ? 5000 : 100;
    const limitNum = Math.max(1, Math.min(maxLimitAllowed, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Backend-driven global sorting pipeline
    let sortOptions = { purchaseDate: -1, createdAt: -1 };
    if (sortBy === 'date-desc') {
      sortOptions = { purchaseDate: -1, createdAt: -1 };
    } else if (sortBy === 'date-asc') {
      sortOptions = { purchaseDate: 1, createdAt: 1 };
    } else if (sortBy === 'amount-desc') {
      sortOptions = { grandTotal: -1, totalAmount: -1, createdAt: -1 };
    } else if (sortBy === 'amount-asc') {
      sortOptions = { grandTotal: 1, totalAmount: 1, createdAt: 1 };
    }

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .populate('products')
        .sort(sortOptions)
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

const safeNum = (val, defaultVal = null) => {
  if (val == null || val === '' || val === '-' || val === 'Not mentioned') return defaultVal;
  const n = Number(val);
  return isNaN(n) ? defaultVal : n;
};

// Helper: Save Product line items associated with a Receipt
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
    const periodValue = safeNum(item.warrantyPeriodValue, null);
    
    let periodUnit = 'months';
    const rawUnit = (item.warrantyPeriodUnit || '').toLowerCase().trim();
    if (rawUnit === 'days' || rawUnit === 'day') periodUnit = 'days';
    else if (rawUnit === 'weeks' || rawUnit === 'week') periodUnit = 'weeks';
    else if (rawUnit === 'years' || rawUnit === 'year') periodUnit = 'years';

    const warrantyExpiryDate = periodValue != null ? calculateWarrantyExpiryDate(purchaseDate, periodValue, periodUnit) : null;
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

    const qty = safeNum(item.quantity, 1) > 0 ? safeNum(item.quantity, 1) : 1;
    const unitPrice = safeNum(item.unitPrice, null);
    const origUnitPrice = safeNum(item.originalUnitPrice, unitPrice);
    const discAmt = safeNum(item.discountAmount, 0);
    const discPct = safeNum(item.discountPercent, 0);
    const lineTot = safeNum(item.lineTotal, unitPrice != null ? unitPrice * qty : null);

    const product = await Product.create({
      receiptId,
      userId,
      productName: prodName,
      brand: item.brand ? String(item.brand).trim() : '',
      category,
      quantity: qty,
      originalUnitPrice: origUnitPrice,
      unitPrice,
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

// Helper: Synchronize Product line items for an existing Receipt without wiping foreign keys (LOGIC-05)
const syncProductsForReceipt = async (userId, receiptId, purchaseDate, itemsArray = []) => {
  const itemsToProcess = Array.isArray(itemsArray) && itemsArray.length > 0
    ? itemsArray
    : [{ productName: 'Item 1', quantity: 1, category: 'Others' }];

  const FEE_ITEM_REGEX = /^(?:protect\s*promise|handling|convenience|platform|delivery|shipping|packaging|service|installation)\s*(?:fee|charges?|amount)?$/i;

  // Retrieve existing products for this receipt
  const existingProducts = await Product.find({ receiptId, userId });
  const existingMap = new Map();
  for (const ep of existingProducts) {
    existingMap.set(ep._id.toString(), ep);
  }

  const retainedProductIds = new Set();
  const finalProducts = [];

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
    const periodValue = safeNum(item.warrantyPeriodValue, null);

    let periodUnit = 'months';
    const rawUnit = (item.warrantyPeriodUnit || '').toLowerCase().trim();
    if (rawUnit === 'days' || rawUnit === 'day') periodUnit = 'days';
    else if (rawUnit === 'weeks' || rawUnit === 'week') periodUnit = 'weeks';
    else if (rawUnit === 'years' || rawUnit === 'year') periodUnit = 'years';

    const warrantyExpiryDate = periodValue != null ? calculateWarrantyExpiryDate(purchaseDate, periodValue, periodUnit) : null;
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

    const qty = safeNum(item.quantity, 1) > 0 ? safeNum(item.quantity, 1) : 1;
    const unitPrice = safeNum(item.unitPrice, null);
    const origUnitPrice = safeNum(item.originalUnitPrice, unitPrice);
    const discAmt = safeNum(item.discountAmount, 0);
    const discPct = safeNum(item.discountPercent, 0);
    const lineTot = safeNum(item.lineTotal, unitPrice != null ? unitPrice * qty : null);

    // Identify if this item matches an existing product
    const candidateId = item._id || item.id;
    let targetProduct = null;

    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId) && existingMap.has(candidateId.toString())) {
      targetProduct = existingMap.get(candidateId.toString());
    } else {
      // Name fallback: match an unretained existing product with same name
      for (const ep of existingProducts) {
        if (!retainedProductIds.has(ep._id.toString()) && ep.productName.toLowerCase() === prodName.toLowerCase()) {
          targetProduct = ep;
          break;
        }
      }
    }

    if (targetProduct) {
      // Update existing product in place - preserves _id, remindersSent flags, and foreign key relations
      targetProduct.productName = prodName;
      targetProduct.brand = item.brand ? String(item.brand).trim() : '';
      targetProduct.category = category;
      targetProduct.quantity = qty;
      targetProduct.originalUnitPrice = origUnitPrice;
      targetProduct.unitPrice = unitPrice;
      targetProduct.discountAmount = discAmt;
      targetProduct.discountPercent = discPct;
      targetProduct.lineTotal = lineTot;
      targetProduct.warrantyPeriodValue = periodValue;
      targetProduct.warrantyPeriodUnit = periodUnit;
      targetProduct.warrantyPeriodMonths = periodMonths;
      targetProduct.warrantyExpiryDate = warrantyExpiryDate;
      targetProduct.warrantyStatus = warrantyStatus;

      await targetProduct.save();
      retainedProductIds.add(targetProduct._id.toString());
      finalProducts.push(targetProduct);
    } else {
      // Create new product item
      const newProduct = await Product.create({
        receiptId,
        userId,
        productName: prodName,
        brand: item.brand ? String(item.brand).trim() : '',
        category,
        quantity: qty,
        originalUnitPrice: origUnitPrice,
        unitPrice,
        discountAmount: discAmt,
        discountPercent: discPct,
        lineTotal: lineTot,
        warrantyPeriodValue: periodValue,
        warrantyPeriodUnit: periodUnit,
        warrantyPeriodMonths: periodMonths,
        warrantyExpiryDate,
        warrantyStatus,
      });
      retainedProductIds.add(newProduct._id.toString());
      finalProducts.push(newProduct);
    }

    await ensureUserCategory(userId, category);
  }

  // Delete only products that were explicitly removed by the user
  const removedProductIds = existingProducts
    .filter((ep) => !retainedProductIds.has(ep._id.toString()))
    .map((ep) => ep._id);

  if (removedProductIds.length > 0) {
    await Product.deleteMany({ _id: { $in: removedProductIds } });
  }

  return finalProducts;
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

    const finalGrandTotal = safeNum(grandTotal != null ? grandTotal : totalAmount, null);
    const itemsList = Array.isArray(products) && products.length > 0 ? products : (Array.isArray(items) ? items : []);

    const subtotalVal = safeNum(subtotal, null);
    const shippingVal = safeNum(shippingAmount, 0);
    const taxVal = safeNum(taxAmount, 0);
    const discountVal = safeNum(discountAmount, 0);
    const discountPercentVal = safeNum(discountPercent, 0);

    // Calculate line total vs grand total validation mismatch
    const sumLineTotals = itemsList.reduce((acc, item) => acc + safeNum(item.lineTotal != null ? item.lineTotal : item.unitPrice, 0), 0);
    const matchesGrand = finalGrandTotal != null && Math.abs(sumLineTotals - finalGrandTotal) <= 1.00;
    const matchesSub = subtotalVal != null && Math.abs(sumLineTotals - subtotalVal) <= 1.00;
    const matchesReconciled = finalGrandTotal != null && Math.abs((sumLineTotals - discountVal + taxVal + shippingVal) - finalGrandTotal) <= 1.00;

    const needsReview = itemsList.length > 0 && finalGrandTotal != null && !matchesGrand && !matchesSub && !matchesReconciled;

    let fileData = req.body.fileData || null;
    let mimeType = req.body.mimeType || null;
    if (!fileData && fileUrl) {
      const rel = fileUrl.replace(/^\/uploads\//, '');
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
      storeName: storeName ? String(storeName).trim() : '',
      invoiceNumber: invoiceNumber ? String(invoiceNumber).trim() : '',
      purchaseDate: parsedPurchaseDate,
      dueDate: parsedDueDate,
      subtotal: subtotalVal,
      discountAmount: discountVal,
      discountPercent: discountPercentVal,
      shippingAmount: shippingVal,
      taxAmount: taxVal,
      grandTotal: finalGrandTotal,
      totalAmount: finalGrandTotal,
      currency: currency || 'INR',
      notes: notes ? String(notes).trim() : '',
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
      ? safeNum(req.body.grandTotal, null)
      : (req.body.totalAmount !== undefined ? safeNum(req.body.totalAmount, null) : existing.grandTotal);

    const updateFields = {
      ...req.body,
      purchaseDate,
      dueDate,
      subtotal: req.body.subtotal !== undefined ? safeNum(req.body.subtotal, null) : existing.subtotal,
      shippingAmount: req.body.shippingAmount !== undefined ? safeNum(req.body.shippingAmount, 0) : existing.shippingAmount,
      taxAmount: req.body.taxAmount !== undefined ? safeNum(req.body.taxAmount, 0) : existing.taxAmount,
      discountAmount: req.body.discountAmount !== undefined ? safeNum(req.body.discountAmount, 0) : existing.discountAmount,
      discountPercent: req.body.discountPercent !== undefined ? safeNum(req.body.discountPercent, 0) : existing.discountPercent,
      grandTotal: finalGrandTotal,
      totalAmount: finalGrandTotal,
      fileData: req.body.fileData || existing.fileData,
      mimeType: req.body.mimeType || existing.mimeType,
      fileType: req.body.fileType && req.body.fileType !== 'manual'
        ? req.body.fileType
        : (existing.fileType && existing.fileType !== 'manual'
            ? existing.fileType
            : (existing.mimeType === 'application/pdf' || existing.fileUrl?.toLowerCase().includes('.pdf') ? 'pdf' : (existing.fileType || 'image'))),
      updatedAt: new Date(),
    };

    const receipt = await Receipt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    // Update products if provided in request without wiping existing foreign keys (LOGIC-05)
    const itemsList = req.body.products || req.body.items;
    if (Array.isArray(itemsList)) {
      await syncProductsForReceipt(req.userId, receipt._id, purchaseDate, itemsList);
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

    // Clean up local physical file if present
    deleteFileIfLocal(receipt.fileUrl);

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

// DELETE /api/receipts/bulk
const bulkDeleteReceipts = async (req, res) => {
  try {
    const { receiptIds } = req.body;

    if (!Array.isArray(receiptIds) || receiptIds.length === 0) {
      return sendError(res, 400, 'receiptIds must be a non-empty array of IDs.');
    }

    // Filter to valid MongoDB ObjectId strings
    const validIds = receiptIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return sendError(res, 400, 'No valid receipt IDs provided.');
    }

    // Find all matching receipts owned by this user
    const receiptsToDelete = await Receipt.find({
      _id: { $in: validIds },
      userId: req.userId,
    }).select('_id fileUrl');

    if (receiptsToDelete.length === 0) {
      return sendError(res, 404, 'No matching receipts found to delete.');
    }

    const idsToDelete = receiptsToDelete.map((r) => r._id);

    // Clean up local files if present
    for (const r of receiptsToDelete) {
      deleteFileIfLocal(r.fileUrl);
    }

    // Delete associated products
    await Product.deleteMany({ receiptId: { $in: idsToDelete } });

    // Delete the receipts
    await Receipt.deleteMany({
      _id: { $in: idsToDelete },
      userId: req.userId,
    });

    logActivity({
      userId: req.userId,
      type: 'receipt_deleted',
      title: 'Bulk Receipts Deleted',
      message: `Deleted ${idsToDelete.length} receipts`,
    });

    return sendSuccess(res, 200, `Deleted ${idsToDelete.length} receipts`, {
      count: idsToDelete.length,
    });
  } catch (error) {
    console.error('Error in bulkDeleteReceipts:', error);
    return sendError(res, 500, 'Server error deleting receipts in bulk.');
  }
};

// PATCH /api/receipts/bulk/category
const bulkUpdateReceiptsCategory = async (req, res) => {
  try {
    const { receiptIds, category } = req.body;
    if (!Array.isArray(receiptIds) || receiptIds.length === 0 || !category) {
      return sendError(res, 400, 'receiptIds array and category string are required.');
    }
    const validIds = receiptIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return sendError(res, 400, 'No valid receipt IDs provided.');
    }

    // Update all products associated with these receipts
    await Product.updateMany(
      { receiptId: { $in: validIds }, userId: req.userId },
      { $set: { category } }
    );

    // Ensure category exists in user categories list
    await ensureUserCategory(req.userId, category);

    logActivity({
      userId: req.userId,
      type: 'receipt_updated',
      title: 'Bulk Category Updated',
      message: `Updated category to "${category}" for ${validIds.length} receipts`,
    });

    return sendSuccess(res, 200, `Updated category for ${validIds.length} receipts`, {
      count: validIds.length,
      category,
    });
  } catch (error) {
    console.error('Error in bulkUpdateReceiptsCategory:', error);
    return sendError(res, 500, 'Server error updating categories in bulk.');
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
  bulkDeleteReceipts,
  bulkUpdateReceiptsCategory,
  updateReceiptStatus,
  triggerReminders,
};
