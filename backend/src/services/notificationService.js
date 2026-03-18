const Notification = require('../models/Notification');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');

class NotificationService {
  /**
   * Get notifications for a user/restaurant
   */
  async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    const query = {};

    if (restaurant) {
      query.$or = [{ restaurant: restaurant._id }, { user: userId }];
    } else {
      query.user = userId;
    }

    if (unreadOnly) query.isRead = false;

    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new AppError('Notification not found.', 404);

    notification.isRead = true;
    await notification.save();
    return notification;
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    const query = {};

    if (restaurant) {
      query.$or = [{ restaurant: restaurant._id }, { user: userId }];
    } else {
      query.user = userId;
    }

    await Notification.updateMany(query, { isRead: true });
    return { message: 'All notifications marked as read.' };
  }

  /**
   * Create notification (utility)
   */
  async createNotification({ restaurantId, userId, title, message, type, data }) {
    return Notification.create({
      restaurant: restaurantId,
      user: userId,
      title,
      message,
      type: type || 'info',
      data,
    });
  }
}

module.exports = new NotificationService();
