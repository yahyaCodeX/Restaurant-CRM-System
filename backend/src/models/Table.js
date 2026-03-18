const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Table must belong to a restaurant'],
    },
    tableNumber: {
      type: Number,
      required: [true, 'Table number is required'],
      min: [1, 'Table number must be at least 1'],
    },
    capacity: {
      type: Number,
      default: 4,
      min: [1, 'Capacity must be at least 1'],
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    location: {
      type: String,
      enum: ['indoor', 'outdoor', 'rooftop', 'private'],
      default: 'indoor',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: table number unique per restaurant
tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);

module.exports = Table;
