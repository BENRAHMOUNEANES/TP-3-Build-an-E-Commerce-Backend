/**
 * Product Mongoose Model
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Fields:
 * - name: String (required, trimmed)
 * - description: String (trimmed)
 * - price: Number (required, >= 0)
 * - category: String (trimmed, default: 'Electronics')
 * - imageUrl: String (trimmed, URL to product image)
 * - stock: Number (default: 0, >= 0)
 * - timestamps: createdAt, updatedAt
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Product price cannot be negative']
    },
    category: {
      type: String,
      trim: true,
      default: 'Electronics'
    },
    imageUrl: {
      type: String,
      trim: true,
      default: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Product stock cannot be negative']
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Also provide 'image' as alias for 'imageUrl' to maintain 100% plug-and-play compatibility with TP2 React frontend
        ret.image = ret.imageUrl;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.image = ret.imageUrl;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtual alias: if payload contains `image`, set `imageUrl`
productSchema.pre('validate', function () {
  if (this.image && !this.imageUrl) {
    this.imageUrl = this.image;
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

