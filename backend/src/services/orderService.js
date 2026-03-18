const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const Table = require('../models/Table');
const AppError = require('../utils/AppError');

class OrderService {
  async _getRestaurantId(userId) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return restaurant._id;
  }

  /**
   * Get all orders for a restaurant
   */
  async getOrders(userId, { status, source, page = 1, limit = 20, startDate, endDate }) {
    const restaurantId = await this._getRestaurantId(userId);
    const query = { restaurant: restaurantId };

    if (status) query.status = status;
    if (source) query.source = source;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name phone')
        .populate('table', 'tableNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single order
   */
  async getOrder(userId, orderId) {
    const restaurantId = await this._getRestaurantId(userId);
    const order = await Order.findOne({ _id: orderId, restaurant: restaurantId })
      .populate('customer', 'name phone email')
      .populate('table', 'tableNumber')
      .populate('items.menuItem', 'name image');

    if (!order) throw new AppError('Order not found.', 404);
    return order;
  }

  /**
   * Create manual order
   */
  async createOrder(userId, data) {
    const restaurantId = await this._getRestaurantId(userId);
    const restaurant = await Restaurant.findById(restaurantId);

    // Calculate totals
    let subtotal = 0;
    const items = data.items.map((item) => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      return { ...item, subtotal: itemSubtotal };
    });

    const tax = subtotal * (restaurant.settings.taxRate / 100);
    const deliveryFee = data.orderType === 'delivery' ? restaurant.settings.deliveryFee : 0;
    const discount = Number(data.discount || 0);
    const totalAmount = Math.max(0, subtotal + tax + deliveryFee - discount);

    // Resolve customer: use selected customer first, fallback to phone-based upsert.
    let customer = null;
    if (data.customer) {
      customer = await Customer.findOne({ _id: data.customer, restaurant: restaurantId });
      if (!customer) {
        throw new AppError('Selected customer not found.', 404);
      }
    } else if (data.customerPhone) {
      customer = await Customer.findOneAndUpdate(
        { restaurant: restaurantId, phone: data.customerPhone },
        {
          $setOnInsert: {
            restaurant: restaurantId,
            name: data.customerName || 'Walk-in Customer',
            phone: data.customerPhone,
            address: data.customerAddress,
          },
        },
        { upsert: true, new: true }
      );
    }

    const customerName = data.customerName || customer?.name;
    const customerPhone = data.customerPhone || customer?.phone;
    const customerAddress = data.customerAddress || customer?.address;

    if (data.orderType === 'delivery' && !customerAddress) {
      throw new AppError('Customer address is required for delivery orders.', 400);
    }

    // Validate table if provided for dine-in orders.
    let tableId = data.table;
    if (tableId) {
      const table = await Table.findOne({ _id: tableId, restaurant: restaurantId });
      if (!table) {
        throw new AppError('Selected table not found.', 404);
      }
      if (table.isOccupied) {
        throw new AppError(`Table ${table.tableNumber} is currently occupied.`, 400);
      }
    }

    const order = await Order.create({
      restaurant: restaurantId,
      items,
      subtotal,
      tax,
      deliveryFee,
      discount,
      totalAmount,
      customer: customer?._id,
      customerName,
      customerPhone,
      customerAddress,
      table: tableId,
      orderType: data.orderType || 'dine_in',
      paymentMethod: data.paymentMethod || 'cash',
      notes: data.notes,
      source: data.source || 'manual',
      status: restaurant.settings.autoAcceptOrders ? 'confirmed' : 'pending',
    });

    // Update customer stats
    if (customer) {
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: { totalOrders: 1, totalSpent: totalAmount },
        lastOrderDate: new Date(),
        ...(customerAddress ? { address: customerAddress } : {}),
        ...(customerName ? { name: customerName } : {}),
      });
    }

    if (tableId && data.orderType === 'dine_in') {
      await Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        isOccupied: true,
        currentOrder: order._id,
      });
    }

    // Create notification
    await Notification.create({
      restaurant: restaurantId,
      title: 'New Order',
      message: `New ${data.source || 'manual'} order #${order.orderNumber} - ${restaurant.settings.currency} ${totalAmount.toFixed(2)}`,
      type: 'order',
      data: { orderId: order._id },
    });

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(userId, orderId, { status, cancelReason, estimatedDeliveryTime }) {
    const restaurantId = await this._getRestaurantId(userId);
    const order = await Order.findOne({ _id: orderId, restaurant: restaurantId });
    if (!order) throw new AppError('Order not found.', 404);

    // Validate status transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new AppError(`Cannot transition from "${order.status}" to "${status}".`, 400);
    }

    order.status = status;
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelReason = cancelReason;
    }
    if (status === 'delivered') {
      order.completedAt = new Date();
      order.paymentStatus = 'paid';
    }
    if (estimatedDeliveryTime) {
      order.estimatedDeliveryTime = estimatedDeliveryTime;
    }
    await order.save();

    if (order.table && (status === 'delivered' || status === 'cancelled')) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'available',
        isOccupied: false,
        currentOrder: null,
      });
    }

    return order;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(userId) {
    const restaurantId = await this._getRestaurantId(userId);

    const stats = await Order.aggregate([
      { $match: { restaurant: restaurantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    return stats;
  }
}

module.exports = new OrderService();
