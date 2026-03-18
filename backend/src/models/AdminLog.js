const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performer is required'],
    },
    targetType: {
      type: String,
      enum: ['user', 'restaurant', 'order', 'menu', 'settings', 'other'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
adminLogSchema.index({ performedBy: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = AdminLog;
