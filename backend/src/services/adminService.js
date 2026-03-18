const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Table = require('../models/Table');
const AdminLog = require('../models/AdminLog');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { sendEmail, emailTemplates } = require('../utils/email');
const logger = require('../utils/logger');

class AdminService {
  /**
   * Get all restaurants with pagination and filtering
   */
  async getRestaurants({ page = 1, limit = 20, status, search }) {
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .populate('owner', 'name email phone lastLogin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Restaurant.countDocuments(query),
    ]);

    return {
      restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve restaurant
   */
  async approveRestaurant(restaurantId, adminId, req) {
    const restaurant = await Restaurant.findById(restaurantId).populate('owner');
    if (!restaurant) throw new AppError('Restaurant not found.', 404);

    if (restaurant.status === 'approved') {
      throw new AppError('Restaurant is already approved.', 400);
    }

    restaurant.status = 'approved';
    restaurant.isActive = true;
    await restaurant.save();

    // Approve the user
    const user = await User.findById(restaurant.owner._id);
    user.isApproved = true;
    await user.save({ validateBeforeSave: false });

    // Create default 10 tables
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      tables.push({ restaurant: restaurant._id, tableNumber: i });
    }
    await Table.insertMany(tables);

    // Send approval email
    try {
      const template = emailTemplates.approvalNotification(restaurant.owner.name, 'approved');
      await sendEmail({
        to: restaurant.owner.email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      logger.warn('Failed to send approval email:', error.message);
    }

    // Create notification
    await Notification.create({
      restaurant: restaurant._id,
      user: restaurant.owner._id,
      title: 'Registration Approved',
      message: 'Your restaurant has been approved! You can now log in and manage your restaurant.',
      type: 'approval',
    });

    // Log admin action
    await AdminLog.create({
      action: 'APPROVE_RESTAURANT',
      performedBy: adminId,
      targetType: 'restaurant',
      targetId: restaurant._id,
      details: { restaurantName: restaurant.name },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return restaurant;
  }

  /**
   * Reject restaurant
   */
  async rejectRestaurant(restaurantId, adminId, reason, req) {
    const restaurant = await Restaurant.findById(restaurantId).populate('owner');
    if (!restaurant) throw new AppError('Restaurant not found.', 404);

    restaurant.status = 'rejected';
    await restaurant.save();

    // Send rejection email
    try {
      const template = emailTemplates.approvalNotification(restaurant.owner.name, 'rejected');
      await sendEmail({
        to: restaurant.owner.email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      logger.warn('Failed to send rejection email:', error.message);
    }

    // Log
    await AdminLog.create({
      action: 'REJECT_RESTAURANT',
      performedBy: adminId,
      targetType: 'restaurant',
      targetId: restaurant._id,
      details: { restaurantName: restaurant.name, reason },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return restaurant;
  }

  /**
   * Suspend restaurant
   */
  async suspendRestaurant(restaurantId, adminId, reason, req) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found.', 404);

    restaurant.status = 'suspended';
    restaurant.isActive = false;
    await restaurant.save();

    // Deactivate user
    await User.findByIdAndUpdate(restaurant.owner, { isActive: false });

    // Log
    await AdminLog.create({
      action: 'SUSPEND_RESTAURANT',
      performedBy: adminId,
      targetType: 'restaurant',
      targetId: restaurant._id,
      details: { restaurantName: restaurant.name, reason },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return restaurant;
  }

  /**
   * Remove restaurant
   */
  async removeRestaurant(restaurantId, adminId, req) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found.', 404);

    // Log before deleting
    await AdminLog.create({
      action: 'REMOVE_RESTAURANT',
      performedBy: adminId,
      targetType: 'restaurant',
      targetId: restaurant._id,
      details: { restaurantName: restaurant.name },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    await Restaurant.findByIdAndDelete(restaurantId);
    await User.findByIdAndUpdate(restaurant.owner, { isActive: false });

    return { message: 'Restaurant removed successfully.' };
  }

  /**
   * Dashboard metrics
   */
  async getDashboardMetrics() {
    const [
      totalRestaurants,
      activeRestaurants,
      pendingRestaurants,
      totalOrders,
      revenueResult,
      todayOrders,
    ] = await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ status: 'approved', isActive: true }),
      Restaurant.countDocuments({ status: 'pending' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    return {
      totalRestaurants,
      activeRestaurants,
      pendingRestaurants,
      totalOrders,
      todayOrders,
      totalRevenue: revenueResult[0]?.total || 0,
    };
  }

  /**
   * Get audit logs
   */
  async getAuditLogs({ page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AdminLog.find()
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdminLog.countDocuments(),
    ]);

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new AdminService();
