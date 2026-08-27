const mongoose = require('mongoose');
const Receipt = require('../models/Receipt.model');
const Product = require('../models/Product.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Conversion rates to INR for consistent total spend calculation
const CURRENCY_TO_INR = {
  INR: 1,
  USD: 83.5,
  EUR: 90.0,
  GBP: 105.0,
  CAD: 61.0,
  AUD: 54.5,
};

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
          totalSpent: {
            $sum: {
              $cond: [
                { $gt: ['$grandTotal', null] },
                '$grandTotal',
                { $ifNull: ['$totalAmount', 0] },
              ],
            },
          },
          currency: { $first: '$currency' },
          firstPurchaseDate: { $min: '$purchaseDate' },
          latestPurchaseDate: { $max: '$purchaseDate' },
          receiptIds: { $push: '$_id' },
          allProductIds: { $push: '$products' },
        },
      },
      {
        $project: {
          _id: 0,
          storeKey: '$_id',
          storeName: 1,
          receiptCount: 1,
          totalSpent: 1,
          currency: { $ifNull: ['$currency', 'INR'] },
          firstPurchaseDate: 1,
          latestPurchaseDate: 1,
          receiptIds: 1,
        },
      },
    ];

    let stores = await Receipt.aggregate(pipeline);

    // Populate products and distinct categories for each store
    for (const store of stores) {
      if (store.receiptIds && store.receiptIds.length > 0) {
        const products = await Product.find({
          receiptId: { $in: store.receiptIds },
        }).select('category');

        store.productCount = products.length;
        store.categories = Array.from(
          new Set(products.map((p) => p.category).filter(Boolean))
        );
      } else {
        store.productCount = 0;
        store.categories = [];
      }
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
    }).populate('receiptId', 'storeName purchaseDate invoiceNumber currency');

    // Aggregate statistics
    let totalSpent = 0;
    let dates = [];
    const categoriesSet = new Set();
    const currencyCounts = {};

    receipts.forEach((r) => {
      const amt = r.grandTotal != null ? r.grandTotal : r.totalAmount || 0;
      totalSpent += amt;
      if (r.purchaseDate) dates.push(new Date(r.purchaseDate));
      const cur = r.currency || 'INR';
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

    const averageSpend =
      receipts.length > 0 ? Number((totalSpent / receipts.length).toFixed(2)) : 0;

    const stats = {
      storeName: receipts[0].storeName || decodedStoreName,
      totalSpent: Number(totalSpent.toFixed(2)),
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
