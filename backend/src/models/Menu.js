const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Menu item must belong to a restaurant'],
    },
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: [
          'appetizers', 'main_course', 'desserts', 'beverages',
          'soups', 'salads', 'sides', 'specials', 'breakfast',
          'lunch', 'dinner', 'snacks', 'biryani', 'karahi',
          'bbq', 'fast_food', 'chinese', 'other'
        ],
        message: '{VALUE} is not a valid category',
      },
    },
    image: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 30,
    },
    allergens: [{
      type: String,
      trim: true,
    }],
    variations: [{
      name: { type: String, trim: true },
      price: { type: Number, min: 0 },
    }],
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
menuSchema.index({ restaurant: 1, category: 1 });
menuSchema.index({ restaurant: 1, isAvailable: 1 });
menuSchema.index({ name: 'text', description: 'text' });

const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu;
