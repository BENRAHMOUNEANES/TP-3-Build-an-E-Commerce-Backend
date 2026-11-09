/**
 * Rate Limiting Middleware
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Protects the API against brute force and Denial of Service (DoS) attacks.
 * Uses express-rate-limit with RFC standard RateLimit-* headers.
 * 
 * Rules:
 * - General Limiter: 100 requests per 15 minutes per IP across /api
 * - Login Limiter: 5 requests per 15 minutes per IP specifically for POST /api/auth/login
 * - Returns HTTP 429 with standard JSON error response format
 */

const { rateLimit } = require('express-rate-limit');

/**
 * General API Limiter (applied globally to /api)
 * Limit: 100 requests / 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      status: 429,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    });
  }
});

/**
 * Login Attempt Limiter (applied to POST /api/auth/login)
 * Limit: 5 requests / 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      status: 429,
      message: 'Too many login attempts from this IP, please try again after 15 minutes.'
    });
  }
});

module.exports = {
  generalLimiter,
  loginLimiter
};

