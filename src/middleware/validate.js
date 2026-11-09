/**
 * Request Validation Middleware
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Inspects results from express-validator check chains.
 * If validation issues are found, formats them into the standard error schema:
 * {
 *   "success": false,
 *   "status": 400,
 *   "message": "Validation failed",
 *   "errors": [ { "field": "email", "message": "..." } ]
 * }
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const formattedErrors = result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = validate;
