/**
 * Authentication Controller
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Implements user registration and login with:
 * - Bcrypt password hashing (salt rounds: 10)
 * - Conflict detection (HTTP 409 if email already registered)
 * - Safe generic error messages on login failure (HTTP 401)
 * - JWT issuance with configurable expiration
 * - Strict exclusion of password hashes in all JSON responses
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        status: 409,
        message: 'A user with this email address already exists'
      });
    }

    // Hash the password with bcrypt (salt rounds = 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create and save new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash
    });

    // Return 201 Created (passwordHash is automatically excluded by toJSON transform)
    return res.status(201).json({
      success: true,
      status: 201,
      message: 'User registered successfully',
      data: {
        user: newUser.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate existing user & issue JWT
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user from DB
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Use generic error message to prevent account enumeration
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid email or password'
      });
    }

    // Verify password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'dztech_super_secret_jwt_key_2026_wamd_ensta';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email
      },
      jwtSecret,
      { expiresIn }
    );

    return res.status(200).json({
      success: true,
      status: 200,
      message: 'Login successful',
      data: {
        token,
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently authenticated user profile
 * GET /api/auth/me (Optional helper endpoint)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(200).json({
        success: true,
        status: 200,
        data: {
          user: req.user
        }
      });
    }
    return res.status(200).json({
      success: true,
      status: 200,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};

