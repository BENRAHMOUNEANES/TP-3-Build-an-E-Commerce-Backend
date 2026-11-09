/**
 * Product Controller
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Provides full CRUD operations for e-commerce products:
 * - GET /api/products        (Public)
 * - GET /api/products/:id    (Public, 400 on invalid ID, 404 on not found)
 * - POST /api/products       (Protected by JWT / OAuth2, 201 Created)
 * - PUT /api/products/:id    (Protected by JWT / OAuth2, 200 OK)
 * - DELETE /api/products/:id (Protected by JWT / OAuth2, 200 OK)
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Check if a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Get all products
 * GET /api/products
 * Public - 200 OK
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'Tous' && category !== 'all') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (search) {
      filter.name = new RegExp(search, 'i');
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      status: 200,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single product by ID
 * GET /api/products/:id
 * Public - 200 OK, 400 Invalid ID, 404 Not Found
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product
 * POST /api/products
 * Protected (JWT or OAuth2 required) - 201 Created, 400 Invalid
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, imageUrl, image, stock } = req.body;

    const newProduct = await Product.create({
      name: name?.trim(),
      description: description?.trim() || '',
      price: Number(price),
      category: category?.trim() || 'Electronics',
      imageUrl: (imageUrl || image || '').trim() || undefined,
      stock: stock !== undefined ? Number(stock) : 0
    });

    return res.status(201).json({
      success: true,
      status: 201,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing product
 * PUT /api/products/:id
 * Protected (JWT or OAuth2 required) - 200 OK, 400 Invalid, 404 Not Found
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Invalid product ID format'
      });
    }

    const updates = { ...req.body };
    if (updates.image && !updates.imageUrl) {
      updates.imageUrl = updates.image;
    }
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }
    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product
 * DELETE /api/products/:id
 * Protected (JWT or OAuth2 required) - 200 OK, 400 Invalid, 404 Not Found
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Invalid product ID format'
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: 'Product deleted successfully',
      data: {
        id: deletedProduct._id,
        name: deletedProduct.name
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
