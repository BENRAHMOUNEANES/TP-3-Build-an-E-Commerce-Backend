/**
 * Product Routes
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Endpoints:
 * - GET    /api/products     : Fetch all products (Public)
 * - GET    /api/products/:id : Fetch single product by ID (Public)
 * - POST   /api/products     : Create new product (Protected: JWT or OAuth2)
 * - PUT    /api/products/:id : Update product by ID (Protected: JWT or OAuth2)
 * - DELETE /api/products/:id : Delete product by ID (Protected: JWT or OAuth2)
 */

const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Validation rules for creating a product
 */
const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 150 })
    .withMessage('Product name cannot exceed 150 characters'),
  body('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid number greater than or equal to 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be an integer greater than or equal to 0'),
  body('category')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('imageUrl')
    .optional()
    .trim()
];

/**
 * Validation rules for updating a product
 */
const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Product name cannot exceed 150 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid number greater than or equal to 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be an integer greater than or equal to 0'),
  body('category')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('imageUrl')
    .optional()
    .trim()
];

// Public endpoints
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected endpoints (Require valid JWT or OAuth2 Bearer token)
router.post('/', authMiddleware, createProductValidation, validate, productController.createProduct);
router.put('/:id', authMiddleware, updateProductValidation, validate, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;

