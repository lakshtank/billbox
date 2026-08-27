const mongoose = require('mongoose');
const Receipt = require('../models/Receipt.model');
const Product = require('../models/Product.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Exchange rates relative to INR (Base Currency)
const EXCHANGE_RATES_TO_INR = {
  INR: 1.0,
  USD: 83.50,
  EUR: 91.20,
  GBP: 106.00,
  CAD: 61.50,
  AUD: 54.80,
  JPY: 0.56,
};

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const userObjId = mongoose.Types.ObjectId.createFromHexString(userId);

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Parallel Database Queries
    const [
      totalReceipts,
      totalProducts,
      thisMonthReceiptsDocs,
      lastMonthReceiptsDocs,
      totalSpentByCurrency,
      warrantyCountsResult,
      recentReceipts,
      upcomingProducts,
      categorySpendingThisMonth,
    ] = await Promise.all([
      Receipt.countDocuments({ userId }),
      Product.countDocuments({ userId }),

      // Receipts this month
      Receipt.find({ userId, purchaseDate: { $gte: startOfThisMonth } }),

      // Receipts last month
      Receipt.find({ userId, purchaseDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),

      // Total spending by currency
      Receipt.aggregate([
        { $match: { userId: userObjId } },
        {
          $group: {
            _id: { $ifNull: ['$currency', 'INR'] },
            total: { $sum: { $ifNull: ['$grandTotal', '$totalAmount'] } },
            count: { $sum: 1 },
          },
        },
      ]),

      // Product warranty counts
      Product.aggregate([
        { $match: { userId: userObjId } },
        { $group: { _id: '$warrantyStatus', count: { $sum: 1 } } },
      ]),

      // Recent 5 receipts with populated products
      Receipt.find({ userId })
        .populate('products')
        .sort({ purchaseDate: -1, createdAt: -1 })
        .limit(5),

      // Upcoming 5 warranty expiries (active or expiring_soon, with an expiry date)
      Product.find({
        userId,
        warrantyExpiryDate: { $ne: null },
        warrantyStatus: { $in: ['active', 'expiring_soon'] },
      })
        .sort({ warrantyExpiryDate: 1 })
        .limit(5),

      // Top categories this month
      Product.aggregate([
        { $match: { userId: userObjId } },
        {
          $lookup: {
            from: 'receipts',
            localField: 'receiptId',
            foreignField: '_id',
            as: 'receiptInfo',
          },
        },
        { $unwind: { path: '$receiptInfo', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            'receiptInfo.purchaseDate': { $gte: startOfThisMonth },
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$category', 'Others'] },
            total: { $sum: { $ifNull: ['$lineTotal', '$unitPrice'] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    // Calculate total spent converted to Base Currency (INR)
    let totalSpentInINR = 0;
    totalSpentByCurrency.forEach((item) => {
      const curr = (item._id || 'INR').toUpperCase();
      const rate = EXCHANGE_RATES_TO_INR[curr] || 1.0;
      totalSpentInINR += (item.total || 0) * rate;
    });

    // Calculate this month vs last month spent
    let thisMonthSpentINR = 0;
    thisMonthReceiptsDocs.forEach((r) => {
      const curr = (r.currency || 'INR').toUpperCase();
      const rate = EXCHANGE_RATES_TO_INR[curr] || 1.0;
      thisMonthSpentINR += (r.grandTotal || r.totalAmount || 0) * rate;
    });

    let lastMonthSpentINR = 0;
    lastMonthReceiptsDocs.forEach((r) => {
      const curr = (r.currency || 'INR').toUpperCase();
      const rate = EXCHANGE_RATES_TO_INR[curr] || 1.0;
      lastMonthSpentINR += (r.grandTotal || r.totalAmount || 0) * rate;
    });

    let spentVsLastMonthDiff = 0;
    if (lastMonthSpentINR > 0) {
      spentVsLastMonthDiff = Math.round(((thisMonthSpentINR - lastMonthSpentINR) / lastMonthSpentINR) * 100);
    } else if (thisMonthSpentINR > 0) {
      spentVsLastMonthDiff = 100;
    }

    const receiptsThisMonthCount = thisMonthReceiptsDocs.length;
    const receiptsLastMonthCount = lastMonthReceiptsDocs.length;
    const receiptsDiff = receiptsThisMonthCount - receiptsLastMonthCount;

    // Warranty counts
    const warrantyCounts = {};
    warrantyCountsResult.forEach((item) => {
      if (item._id) warrantyCounts[item._id] = item.count;
    });

    // Upcoming warranty items formatted with days remaining
    const warrantyTimeline = upcomingProducts.map((p) => {
      const expiry = new Date(p.warrantyExpiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      return {
        _id: p._id,
        productName: p.productName,
        category: p.category || 'Others',
        brand: p.brand || '',
        daysLeft,
        expiryDate: p.warrantyExpiryDate,
      };
    });

    // Calculate top categories this month & all-time
    const totalMonthCategorySpend = categorySpendingThisMonth.reduce((acc, c) => acc + (c.total || 0), 0);
    const topCategoriesThisMonth = categorySpendingThisMonth.map((c) => {
      const percentage = totalMonthCategorySpend > 0 ? Math.round((c.total / totalMonthCategorySpend) * 100) : 0;
      return {
        category: c._id,
        total: c.total || 0,
        percentage,
      };
    });

    // All-time Category Spending (fallback if current month is empty)
    const categorySpendingAllTime = await Product.aggregate([
      { $match: { userId: userObjId } },
      {
        $group: {
          _id: { $ifNull: ['$category', 'Others'] },
          total: { $sum: { $ifNull: ['$lineTotal', '$unitPrice'] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalAllCategorySpend = categorySpendingAllTime.reduce((acc, c) => acc + (c.total || 0), 0);
    const topCategoriesAllTime = categorySpendingAllTime.map((c) => {
      const percentage = totalAllCategorySpend > 0 ? Math.round((c.total / totalAllCategorySpend) * 100) : 0;
      return {
        category: c._id,
        total: c.total || 0,
        percentage,
      };
    });

    // Calculate spending over time points across ALL user receipts
    const allDailyReceipts = await Receipt.aggregate([
      { $match: { userId: userObjId } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$purchaseDate', '$createdAt'] },
            },
          },
          total: { $sum: { $ifNull: ['$grandTotal', '$totalAmount'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const spendingOverTime = allDailyReceipts.map((item) => {
      const d = new Date(item._id);
      const label = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        : item._id;
      return {
        date: label,
        rawDate: item._id,
        amount: item.total || 0,
      };
    });

    const stats = {
      totalReceipts,
      totalProducts,
      totalSpent: totalSpentInINR,
      thisMonthSpent: thisMonthSpentINR,
      lastMonthSpent: lastMonthSpentINR,
      spentVsLastMonthDiff,
      receiptsThisMonth: receiptsThisMonthCount,
      receiptsDiff,
      baseCurrency: 'INR',
      activeWarranties: warrantyCounts.active || 0,
      expiringWarranties: warrantyCounts.expiring_soon || 0,
      recentReceipts,
      warrantyTimeline,
      topCategoriesThisMonth: topCategoriesThisMonth.length > 0 ? topCategoriesThisMonth : topCategoriesAllTime,
      spendingOverTime,
    };

    return sendSuccess(res, 200, 'Stats fetched', stats);
  } catch (error) {
    console.error('getStats error:', error);
    return sendError(res, 500, 'Server error fetching dashboard stats.');
  }
};

// GET /api/dashboard/warranty-timeline
// Buckets user warranties into Expiring Soon (<=30d), Next 3 Months, Next 6 Months, Later (>6mo), and Expired
const getWarrantyTimeline = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;

    const products = await Product.find({
      userId,
      warrantyExpiryDate: { $ne: null },
    })
      .populate('receiptId', 'storeName purchaseDate')
      .sort({ warrantyExpiryDate: 1 });

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const buckets = {
      dueSoon: { label: 'Due Soon (≤30 Days)', count: 0, items: [] },
      next3Months: { label: 'Next 3 Months (31–90 Days)', count: 0, items: [] },
      next6Months: { label: 'Next 6 Months (91–180 Days)', count: 0, items: [] },
      later: { label: 'Later (>180 Days)', count: 0, items: [] },
      expired: { label: 'Expired', count: 0, items: [] },
    };

    for (const p of products) {
      const expiry = new Date(p.warrantyExpiryDate);
      const expiryMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
      const diffMs = expiryMidnight.getTime() - todayMidnight.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const itemSummary = {
        _id: p._id,
        productName: p.productName,
        brand: p.brand,
        category: p.category,
        storeName: p.receiptId?.storeName || 'Merchant',
        warrantyExpiryDate: p.warrantyExpiryDate,
        daysRemaining,
      };

      if (daysRemaining <= 0) {
        buckets.expired.count++;
        buckets.expired.items.push(itemSummary);
      } else if (daysRemaining <= 30) {
        buckets.dueSoon.count++;
        buckets.dueSoon.items.push(itemSummary);
      } else if (daysRemaining <= 90) {
        buckets.next3Months.count++;
        buckets.next3Months.items.push(itemSummary);
      } else if (daysRemaining <= 180) {
        buckets.next6Months.count++;
        buckets.next6Months.items.push(itemSummary);
      } else {
        buckets.later.count++;
        buckets.later.items.push(itemSummary);
      }
    }

    return sendSuccess(res, 200, 'Warranty timeline retrieved', { buckets, totalProducts: products.length });
  } catch (error) {
    console.error('getWarrantyTimeline error:', error);
    return sendError(res, 500, 'Failed to fetch warranty timeline');
  }
};

// GET /api/dashboard/activity
// Returns recent activity feed for current user
const getRecentActivity = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { limit = 10 } = req.query;

    const Activity = require('../models/Activity.model');

    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(50, parseInt(limit, 10) || 10));

    return sendSuccess(res, 200, 'Recent activity retrieved', { activities });
  } catch (error) {
    console.error('getRecentActivity error:', error);
    return sendError(res, 500, 'Failed to fetch recent activity');
  }
};

module.exports = {
  getStats,
  getWarrantyTimeline,
  getRecentActivity,
};
