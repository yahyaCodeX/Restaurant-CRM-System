const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Restaurant must have an owner'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    logo: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    cuisine: [{
      type: String,
      trim: true,
    }],
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Pakistan' },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    operatingHours: {
      monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    },
    settings: {
      currency: { type: String, default: 'PKR' },
      taxRate: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      minimumOrder: { type: Number, default: 0 },
      autoAcceptOrders: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ status: 1 });
restaurantSchema.index({ 'address.city': 1 });

// Virtuals
restaurantSchema.virtual('menus', {
  ref: 'Menu',
  localField: '_id',
  foreignField: 'restaurant',
});

restaurantSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'restaurant',
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
