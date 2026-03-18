const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  variation: {
    type: String,
  },
  specialInstructions: {
    type: String,
    maxlength: 300,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: true });

const orderSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Order must belong to a restaurant'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    source: {
      type: String,
      enum: ['whatsapp', 'manual', 'dashboard', 'phone'],
      default: 'dashboard',
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
    },
    orderType: {
      type: String,
      enum: ['dine_in', 'takeaway', 'delivery'],
      default: 'dine_in',
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'other'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },
    whatsappMessageId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ orderNumber: 1 });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments({ restaurant: this.restaurant });
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    this.orderNumber = `ORD-${datePrefix}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
