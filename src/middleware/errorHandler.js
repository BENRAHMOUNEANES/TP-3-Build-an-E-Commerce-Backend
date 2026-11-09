/**
 * Centralized Error Handling Middleware
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Ensures every error returned across the application strictly adheres to the standard format:
 * {
 *   "success": false,
 *   "status": <HTTP_STATUS_CODE>,
 *   "message": "<Human readable message>",
 *   "errors": [optional details array]
 * }
 * 
 * Security: Stack traces are NEVER leaked in responses.
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  // Handle SyntaxError for malformed JSON request bodies
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Handle Mongoose CastError (e.g. invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': ${err.value}`;
  }

  // Handle MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedKeys = Object.keys(err.keyValue || {});
    const field = duplicatedKeys.length > 0 ? duplicatedKeys[0] : 'field';
    message = `A record with this ${field} already exists`;
  }

  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authorization token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authorization token has expired';
  }

  // Build the clean standardized JSON response
  const responseBody = {
    success: false,
    status: statusCode,
    message
  };

  if (errors && errors.length > 0) {
    responseBody.errors = errors;
  }

  // Optional server-side logging for unexpected 500s
  if (statusCode >= 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json(responseBody);
};

/**
 * 404 Handler for Unknown Routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};

