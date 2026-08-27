const Product = require('../models/Product.model');
const Receipt = require('../models/Receipt.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { logActivity } = require('../services/activity.service');

// GET /api/products
// List all products for current user with search, category, warrantyStatus filters & pagination
const getProducts = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const {
      page = 1,
      limit = 12,
      search = '',
      category = 'All',
      warrantyStatus = 'All',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { userId };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (warrantyStatus && warrantyStatus !== 'All') {
      query.warrantyStatus = warrantyStatus;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { productName: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('receiptId', 'storeName purchaseDate fileUrl fileType publicToken currency'),
      Product.countDocuments(query),
    ]);

    return sendSuccess(res, 200, 'Products retrieved successfully', {
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return sendError(res, 500, 'Failed to fetch products');
  }
};

// GET /api/products/:id
// Get single product populated with receipt info
const getProductById = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, userId }).populate(
      'receiptId',
      'storeName purchaseDate invoiceNumber fileUrl fileType publicToken currency subtotal grandTotal'
    );

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    return sendSuccess(res, 200, 'Product retrieved successfully', { product });
  } catch (error) {
    console.error('getProductById error:', error);
    return sendError(res, 500, 'Failed to fetch product');
  }
};

// POST /api/products
// Create a new product
const createProduct = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const {
      productName,
      brand,
      category,
      quantity = 1,
      unitPrice = null,
      lineTotal = null,
      receiptId = null,
      warrantyPeriodValue = null,
      warrantyPeriodUnit = 'months',
      warrantyPeriodMonths = null,
      warrantyExpiryDate = null,
      warrantyStatus = 'none',
    } = req.body;

    if (!productName || !productName.trim()) {
      return sendError(res, 400, 'Product name is required');
    }

    // If receiptId provided, verify it belongs to user
    if (receiptId) {
      const receipt = await Receipt.findOne({ _id: receiptId, userId });
      if (!receipt) {
        return sendError(res, 404, 'Linked receipt not found');
      }
    }

    const calculatedLineTotal = lineTotal != null ? Number(lineTotal) : unitPrice != null ? Number(unitPrice) * Number(quantity) : null;

    const product = await Product.create({
      userId,
      productName: productName.trim(),
      brand: brand ? brand.trim() : '',
      category: category || 'Others',
      quantity: Math.max(1, Number(quantity) || 1),
      unitPrice: unitPrice != null ? Number(unitPrice) : null,
      lineTotal: calculatedLineTotal,
      receiptId: receiptId || undefined,
      warrantyPeriodValue: warrantyPeriodValue != null ? Number(warrantyPeriodValue) : null,
      warrantyPeriodUnit: warrantyPeriodUnit || 'months',
      warrantyPeriodMonths: warrantyPeriodMonths != null ? Number(warrantyPeriodMonths) : null,
      warrantyExpiryDate: warrantyExpiryDate ? new Date(warrantyExpiryDate) : null,
      warrantyStatus: warrantyStatus || 'none',
    });

    const populated = await Product.findById(product._id).populate(
      'receiptId',
      'storeName purchaseDate fileUrl fileType publicToken currency'
    );

    logActivity({
      userId,
      type: 'product_created',
      title: 'Product Added',
      message: `Added ${product.productName}${product.brand ? ` (${product.brand})` : ''}`,
      refId: product._id,
      refModel: 'Product',
    });

    return sendSuccess(res, 201, 'Product created successfully', { product: populated });
  } catch (error) {
    console.error('createProduct error:', error);
    return sendError(res, 500, 'Failed to create product');
  }
};

// PUT /api/products/:id
// Update product
const updateProduct = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { id } = req.params;
    const updates = { ...req.body };

    const product = await Product.findOne({ _id: id, userId });
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    if (updates.productName !== undefined) {
      if (!updates.productName.trim()) {
        return sendError(res, 400, 'Product name cannot be empty');
      }
      product.productName = updates.productName.trim();
    }

    if (updates.brand !== undefined) product.brand = updates.brand.trim();
    if (updates.category !== undefined) product.category = updates.category;
    if (updates.quantity !== undefined) product.quantity = Math.max(1, Number(updates.quantity) || 1);
    if (updates.unitPrice !== undefined) product.unitPrice = updates.unitPrice != null ? Number(updates.unitPrice) : null;
    if (updates.lineTotal !== undefined) {
      product.lineTotal = updates.lineTotal != null ? Number(updates.lineTotal) : null;
    } else if (updates.unitPrice !== undefined || updates.quantity !== undefined) {
      product.lineTotal = product.unitPrice != null ? product.unitPrice * product.quantity : null;
    }

    if (updates.warrantyPeriodValue !== undefined) product.warrantyPeriodValue = updates.warrantyPeriodValue;
    if (updates.warrantyPeriodUnit !== undefined) product.warrantyPeriodUnit = updates.warrantyPeriodUnit;
    if (updates.warrantyPeriodMonths !== undefined) product.warrantyPeriodMonths = updates.warrantyPeriodMonths;
    if (updates.warrantyExpiryDate !== undefined) {
      product.warrantyExpiryDate = updates.warrantyExpiryDate ? new Date(updates.warrantyExpiryDate) : null;
    }
    if (updates.warrantyStatus !== undefined) product.warrantyStatus = updates.warrantyStatus;

    await product.save();

    const populated = await Product.findById(product._id).populate(
      'receiptId',
      'storeName purchaseDate fileUrl fileType publicToken currency'
    );

    logActivity({
      userId,
      type: 'product_updated',
      title: 'Product Updated',
      message: `Updated details for ${product.productName}`,
      refId: product._id,
      refModel: 'Product',
    });

    return sendSuccess(res, 200, 'Product updated successfully', { product: populated });
  } catch (error) {
    console.error('updateProduct error:', error);
    return sendError(res, 500, 'Failed to update product');
  }
};

// DELETE /api/products/:id
// Delete product
const deleteProduct = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { id } = req.params;

    const product = await Product.findOneAndDelete({ _id: id, userId });
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    logActivity({
      userId,
      type: 'product_deleted',
      title: 'Product Removed',
      message: `Deleted product ${product.productName}`,
      refId: product._id,
      refModel: 'Product',
    });

    return sendSuccess(res, 200, 'Product deleted successfully', { id });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return sendError(res, 500, 'Failed to delete product');
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
