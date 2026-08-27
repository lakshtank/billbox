const Category = require('../models/Category.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Appliances',
  'Medical',
  'Fashion',
  'Furniture',
  'Groceries',
  'Others',
];

/**
 * GET /api/categories
 * Retrieves all categories for the logged-in user.
 * If user has no categories, seeds default categories.
 */
const getCategories = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    let categories = await Category.find({ userId }).sort({ name: 1 }).lean();

    if (categories.length === 0) {
      // Seed default categories for new user
      const seedDocs = DEFAULT_CATEGORIES.map((name) => ({ userId, name }));
      await Category.insertMany(seedDocs, { ordered: false }).catch(() => {});
      categories = await Category.find({ userId }).sort({ name: 1 }).lean();
    }

    const categoryNames = categories.map((c) => c.name);
    return sendSuccess(res, 200, 'Categories retrieved successfully', {
      categories: categoryNames,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return sendError(res, 500, 'Failed to retrieve categories');
  }
};

/**
 * Upserts a category name for a user (helper function used in receipt saving & controller)
 */
const ensureUserCategory = async (userId, categoryName) => {
  if (!categoryName || typeof categoryName !== 'string') return;
  const trimmed = categoryName.trim();
  if (!trimmed) return;

  try {
    // Check if category exists case-insensitively for this user
    const existing = await Category.findOne({
      userId,
      name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (!existing) {
      await Category.create({ userId, name: trimmed });
    }
  } catch (err) {
    // Ignore duplicate key race conditions
    if (err.code !== 11000) {
      console.error('Error auto-creating user category:', err.message);
    }
  }
};

/**
 * Helper to fetch category name list for a user (for Gemini prompt)
 */
const getUserCategoryNames = async (userId) => {
  try {
    let categories = await Category.find({ userId }).select('name').lean();
    if (categories.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    return categories.map((c) => c.name);
  } catch (err) {
    return DEFAULT_CATEGORIES;
  }
};

module.exports = {
  getCategories,
  ensureUserCategory,
  getUserCategoryNames,
  DEFAULT_CATEGORIES,
};
