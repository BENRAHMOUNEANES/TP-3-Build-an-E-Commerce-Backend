/**
 * User Mongoose Model
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Fields:
 * - name: String (required, trimmed)
 * - email: String (required, unique, lowercase, trimmed, validated format)
 * - passwordHash: String (required, bcrypt hash)
 * - timestamps: createdAt, updatedAt
 * 
 * Security rule:
 * Plain passwords or passwordHash must NEVER be returned in API responses.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        // Strip sensitive fields
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

/**
 * Compare candidate password with the stored bcrypt hash
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

