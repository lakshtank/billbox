const mongoose = require('mongoose');
const Receipt = require('../models/Receipt.model');
const Product = require('../models/Product.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const { EXCHANGE_RATES_TO_INR, convertToINR } = require('../constants/currency.constants');

// GET /api/stores
// Returns aggregated list of stores for current user
const getStores = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { search = '', sortBy = 'spend_desc', page = 1, limit = 20 } = req.query;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matchStage = {
      userId: userObjectId,
      storeName: { $exists: true, $ne: '' },
    };

    if (search && search.trim()) {
      matchStage.storeName = { $regex: search.trim(), $options: 'i' };
    }

    // Aggregation pipeline to group receipts by storeName
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$storeName' } } },
          storeName: { $first: '$storeName' },
          receiptCount: { $sum: 1 },
          firstPurchaseDate: { $min: '$purchaseDate' },
          latestPurchaseDate: { $max: '$purchaseDate' },
          receiptIds: { $push: '$_id' },
          receipts: {
            $push: {
              _id: '$_id',
              amount: {
                $cond: [
                  { $gt: ['$grandTotal', null] },
                  '$grandTotal',
                  { $ifNull: ['$totalAmount', 0] },
                ],
              },
              currency: '$currency',
              purchaseDate: '$purchaseDate',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          storeKey: '$_id',
          storeName: 1,
          receiptCount: 1,
          firstPurchaseDate: 1,
          latestPurchaseDate: 1,
          receiptIds: 1,
          receipts: 1,
        },
      },
    ];

    let stores = await Receipt.aggregate(pipeline);

    // Collect all receipt IDs across all stores for a single batch Product lookup (DB-02: Eliminate N+1)
    const allReceiptIds = [];
    const storeReceiptMap = new Map();

    for (const store of stores) {
      // Normalize multi-currency spend into store's primary currency (LOGIC-06)
      let totalSpentInINR = 0;
      const currencyCounts = {};

      for (const r of store.receipts || []) {
        const amt = Number(r.amount) || 0;
        const cur = (r.currency || 'INR').toUpperCase();
        totalSpentInINR += convertToINR(amt, cur);
        currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
      }

      const primaryCurrency =
        Object.keys(currencyCounts).sort(
          (a, b) => currencyCounts[b] - currencyCounts[a]
        )[0] || 'INR';

      const targetRate = EXCHANGE_RATES_TO_INR[primaryCurrency] || 1.0;
      const totalSpent = Number((totalSpentInINR / targetRate).toFixed(2));
      const averageSpend =
        store.receiptCount > 0 ? Number((totalSpent / store.receiptCount).toFixed(2)) : 0;

      store.currency = primaryCurrency;
      store.totalSpent = totalSpent;
      store.averageSpend = averageSpend;

      store.productCount = 0;
      store.categoriesSet = new Set();

      if (store.receiptIds && store.receiptIds.length > 0) {
        for (const rId of store.receiptIds) {
          allReceiptIds.push(rId);
          storeReceiptMap.set(rId.toString(), store);
        }
      }
    }

    // Single batch query for all products across all stores (DB-02)
    if (allReceiptIds.length > 0) {
      const products = await Product.find({
        userId: userObjectId,
        receiptId: { $in: allReceiptIds },
      })
        .select('receiptId category')
        .lean();

      for (const prod of products) {
        if (prod.receiptId) {
          const store = storeReceiptMap.get(prod.receiptId.toString());
          if (store) {
            store.productCount++;
            if (prod.category) store.categoriesSet.add(prod.category);
          }
        }
      }
    }

    // Clean up temporary sets and internal arrays
    for (const store of stores) {
      store.categories = Array.from(store.categoriesSet || []);
      delete store.categoriesSet;
      delete store.receipts;
    }

    // Sorting
    if (sortBy === 'spend_desc') {
      stores.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    } else if (sortBy === 'spend_asc') {
      stores.sort((a, b) => (a.totalSpent || 0) - (b.totalSpent || 0));
    } else if (sortBy === 'receipts_desc') {
      stores.sort((a, b) => (b.receiptCount || 0) - (a.receiptCount || 0));
    } else if (sortBy === 'recent') {
      stores.sort(
        (a, b) =>
          new Date(b.latestPurchaseDate || 0) - new Date(a.latestPurchaseDate || 0)
      );
    } else if (sortBy === 'name_asc') {
      stores.sort((a, b) => (a.storeName || '').localeCompare(b.storeName || ''));
    }

    const totalStores = stores.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const paginatedStores = stores.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return sendSuccess(res, 200, 'Stores fetched successfully', {
      stores: paginatedStores,
      total: totalStores,
      page: pageNum,
      totalPages: Math.ceil(totalStores / limitNum) || 1,
    });
  } catch (error) {
    console.error('getStores error:', error);
    return sendError(res, 500, 'Failed to fetch stores');
  }
};

// GET /api/stores/:storeName
// Returns detailed stats, receipts, and products for a single store
const getStoreDetail = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { storeName } = req.params;

    if (!storeName || !decodeURIComponent(storeName).trim()) {
      return sendError(res, 400, 'Store name is required');
    }

    const decodedStoreName = decodeURIComponent(storeName).trim();
    const storeRegex = new RegExp(`^${decodedStoreName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');

    const receipts = await Receipt.find({
      userId,
      storeName: { $regex: storeRegex },
    })
      .populate('products')
      .sort({ purchaseDate: -1, createdAt: -1 });

    if (!receipts || receipts.length === 0) {
      return sendError(res, 404, 'Store not found or has no receipts');
    }

    // Collect all receipt IDs
    const receiptIds = receipts.map((r) => r._id);

    // Fetch all products associated with these receipts
    const products = await Product.find({
      userId,
      receiptId: { $in: receiptIds },
    }).populate('receiptId', 'storeName purchaseDate invoiceNumber currency fileUrl fileData mimeType fileType publicToken');

    // Aggregate statistics
    let totalSpentInINR = 0;
    let dates = [];
    const categoriesSet = new Set();
    const currencyCounts = {};

    receipts.forEach((r) => {
      const amt = r.grandTotal != null ? r.grandTotal : r.totalAmount || 0;
      const cur = (r.currency || 'INR').toUpperCase();
      totalSpentInINR += convertToINR(amt, cur);
      if (r.purchaseDate) dates.push(new Date(r.purchaseDate));
      currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
    });

    products.forEach((p) => {
      if (p.category) categoriesSet.add(p.category);
    });

    dates.sort((a, b) => a - b);
    const firstPurchaseDate = dates.length > 0 ? dates[0] : null;
    const latestPurchaseDate = dates.length > 0 ? dates[dates.length - 1] : null;

    // Primary currency is the most frequent
    const primaryCurrency =
      Object.keys(currencyCounts).sort(
        (a, b) => currencyCounts[b] - currencyCounts[a]
      )[0] || 'INR';

    const targetRate = EXCHANGE_RATES_TO_INR[primaryCurrency] || 1.0;
    const totalSpent = Number((totalSpentInINR / targetRate).toFixed(2));
    const averageSpend =
      receipts.length > 0 ? Number((totalSpent / receipts.length).toFixed(2)) : 0;

    const stats = {
      storeName: receipts[0].storeName || decodedStoreName,
      totalSpent,
      currency: primaryCurrency,
      receiptCount: receipts.length,
      productCount: products.length,
      averageSpend,
      firstPurchaseDate,
      latestPurchaseDate,
      categories: Array.from(categoriesSet),
    };

    return sendSuccess(res, 200, 'Store detail fetched successfully', {
      stats,
      receipts,
      products,
    });
  } catch (error) {
    console.error('getStoreDetail error:', error);
    return sendError(res, 500, 'Failed to fetch store detail');
  }
};

module.exports = {
  getStores,
  getStoreDetail,
};
