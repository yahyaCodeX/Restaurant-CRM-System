const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');

class AnalyticsService {
  async _getRestaurantId(userId) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return restaurant._id;
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(userId, { period = 'today' }) {
    const restaurantId = await this._getRestaurantId(userId);
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const [salesData, ordersByStatus, topItems, customerStats] = await Promise.all([
      // Revenue and order count
      Order.aggregate([
        {
          $match: {
            restaurant: restaurantId,
            createdAt: { $gte: startDate },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            averageOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]),

      // Orders by status
      Order.aggregate([
        {
          $match: { restaurant: restaurantId, createdAt: { $gte: startDate } },
        },
        {
          $group: { _id: '$status', count: { $sum: 1 } },
        },
      ]),

      // Top selling items
      Order.aggregate([
        {
          $match: {
            restaurant: restaurantId,
            createdAt: { $gte: startDate },
            status: { $ne: 'cancelled' },
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]),

      // Customer stats
      Customer.aggregate([
        { $match: { restaurant: restaurantId } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            totalSpent: { $sum: '$totalSpent' },
            averageSpend: { $avg: '$totalSpent' },
          },
        },
      ]),
    ]);

    return {
      period,
      sales: salesData[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
      ordersByStatus: ordersByStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      topSellingItems: topItems,
      customers: customerStats[0] || { totalCustomers: 0, totalSpent: 0, averageSpend: 0 },
    };
  }

  /**
   * Get daily sales for charting
   */
  async getDailySales(userId, days = 30) {
    const restaurantId = await this._getRestaurantId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailySales = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return dailySales;
  }
}

module.exports = new AnalyticsService();
