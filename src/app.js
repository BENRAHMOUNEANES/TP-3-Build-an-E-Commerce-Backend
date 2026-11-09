/**
 * Express Application Setup
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Configures middleware pipeline, CORS, rate limiters, routes, and error handlers.
 */

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const { generalLimiter } = require('./middleware/rateLimiters');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// 1. CORS Configuration for React Frontend (TD-TP 2)
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 2. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Global Rate Limiter for all API routes (100 req / 15 min)
app.use('/api', generalLimiter);

// 4. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: 'DzTech Store API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root friendly welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: 'Welcome to DzTech Store REST API (ENSTA WAMD TD-TP 3)',
    endpoints: {
      health: 'GET /api/health',
      products: 'GET /api/products',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// 6. 404 Catch-All for undefined routes
app.use(notFoundHandler);

// 7. Centralized Error Handler (Must be registered last)
app.use(errorHandler);

module.exports = app;
