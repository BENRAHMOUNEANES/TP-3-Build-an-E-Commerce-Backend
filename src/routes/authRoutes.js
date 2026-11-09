/**
 * Authentication Routes
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Endpoints:
 * - POST /api/auth/register : Register a new user
 * - POST /api/auth/login    : Authenticate user & receive JWT (Rate limited: 5 req / 15 min)
 * - GET  /api/auth/me       : Verify currently authenticated identity (Protected)
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiters');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Validation rules for registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

/**
 * Validation rules for login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// POST /api/auth/register
router.post('/register', registerValidation, validate, authController.register);

// POST /api/auth/login (Protected by loginLimiter: max 5 requests per 15 min)
router.post('/login', loginLimiter, loginValidation, validate, authController.login);

// GET /api/auth/me (Protected by hybrid auth middleware)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
