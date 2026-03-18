const Customer = require('../models/Customer');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');

class CustomerService {
  async _getRestaurantId(userId) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return restaurant._id;
  }

  /**
   * Get all customers
   */
  async getCustomers(userId, { search, page = 1, limit = 20 }) {
    const restaurantId = await this._getRestaurantId(userId);
    const query = { restaurant: restaurantId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ lastOrderDate: -1, createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(query),
    ]);

    return {
      customers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single customer
   */
  async getCustomer(userId, customerId) {
    const restaurantId = await this._getRestaurantId(userId);
    const customer = await Customer.findOne({ _id: customerId, restaurant: restaurantId });
    if (!customer) throw new AppError('Customer not found.', 404);
    return customer;
  }

  /**
   * Create customer
   */
  async createCustomer(userId, data) {
    const restaurantId = await this._getRestaurantId(userId);

    // Check duplicate phone for this restaurant
    const existing = await Customer.findOne({ restaurant: restaurantId, phone: data.phone });
    if (existing) {
      throw new AppError('A customer with this phone number already exists.', 400);
    }

    const customer = await Customer.create({ ...data, restaurant: restaurantId });
    return customer;
  }

  /**
   * Update customer
   */
  async updateCustomer(userId, customerId, data) {
    const restaurantId = await this._getRestaurantId(userId);
    const customer = await Customer.findOneAndUpdate(
      { _id: customerId, restaurant: restaurantId },
      data,
      { new: true, runValidators: true }
    );
    if (!customer) throw new AppError('Customer not found.', 404);
    return customer;
  }

  /**
   * Delete customer
   */
  async deleteCustomer(userId, customerId) {
    const restaurantId = await this._getRestaurantId(userId);
    const customer = await Customer.findOneAndDelete({ _id: customerId, restaurant: restaurantId });
    if (!customer) throw new AppError('Customer not found.', 404);
    return { message: 'Customer deleted successfully.' };
  }

  /**
   * Get customer order history
   */
  async getCustomerHistory(userId, customerId) {
    const restaurantId = await this._getRestaurantId(userId);
    const customer = await Customer.findOne({ _id: customerId, restaurant: restaurantId });
    if (!customer) throw new AppError('Customer not found.', 404);

    const Order = require('../models/Order');
    const orders = await Order.find({ customer: customerId, restaurant: restaurantId })
      .sort({ createdAt: -1 })
      .limit(50);

    return { customer, orders };
  }
}

module.exports = new CustomerService();
