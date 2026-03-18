const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Customer must belong to a restaurant'],
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    whatsappId: {
      type: String,
      trim: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: phone unique per restaurant
customerSchema.index({ restaurant: 1, phone: 1 }, { unique: true });
customerSchema.index({ restaurant: 1, name: 'text' });

// Virtual for orders
customerSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'customer',
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
