const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');

class MenuService {
  /**
   * Get restaurant ID from owner user ID
   */
  async _getRestaurantId(userId) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return restaurant._id;
  }

  /**
   * Get all menu items for a restaurant
   */
  async getMenuItems(userId, { category, search, page = 1, limit = 50 }) {
    const restaurantId = await this._getRestaurantId(userId);
    const query = { restaurant: restaurantId };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Menu.find(query).sort({ category: 1, sortOrder: 1, name: 1 }).skip(skip).limit(limit),
      Menu.countDocuments(query),
    ]);

    return {
      items,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Create a new menu item
   */
  async createMenuItem(userId, data) {
    const restaurantId = await this._getRestaurantId(userId);
    const item = await Menu.create({ ...data, restaurant: restaurantId });
    return item;
  }

  /**
   * Get a single menu item
   */
  async getMenuItem(userId, itemId) {
    const restaurantId = await this._getRestaurantId(userId);
    const item = await Menu.findOne({ _id: itemId, restaurant: restaurantId });
    if (!item) throw new AppError('Menu item not found.', 404);
    return item;
  }

  /**
   * Update a menu item
   */
  async updateMenuItem(userId, itemId, data) {
    const restaurantId = await this._getRestaurantId(userId);
    const item = await Menu.findOneAndUpdate(
      { _id: itemId, restaurant: restaurantId },
      data,
      { new: true, runValidators: true }
    );
    if (!item) throw new AppError('Menu item not found.', 404);
    return item;
  }

  /**
   * Delete a menu item
   */
  async deleteMenuItem(userId, itemId) {
    const restaurantId = await this._getRestaurantId(userId);
    const item = await Menu.findOneAndDelete({ _id: itemId, restaurant: restaurantId });
    if (!item) throw new AppError('Menu item not found.', 404);
    return { message: 'Menu item deleted successfully.' };
  }

  /**
   * Update menu item image
   */
  async updateMenuImage(userId, itemId, imageUrl) {
    const restaurantId = await this._getRestaurantId(userId);
    const item = await Menu.findOneAndUpdate(
      { _id: itemId, restaurant: restaurantId },
      { image: imageUrl },
      { new: true }
    );
    if (!item) throw new AppError('Menu item not found.', 404);
    return item;
  }

  /**
   * Toggle availability
   */
  async toggleAvailability(userId, itemId) {
    const restaurantId = await this._getRestaurantId(userId);
    const item = await Menu.findOne({ _id: itemId, restaurant: restaurantId });
    if (!item) throw new AppError('Menu item not found.', 404);

    item.isAvailable = !item.isAvailable;
    await item.save();
    return item;
  }

  /**
   * Get menu categories with item count
   */
  async getCategories(userId) {
    const restaurantId = await this._getRestaurantId(userId);
    const categories = await Menu.aggregate([
      { $match: { restaurant: restaurantId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return categories.map((c) => ({ category: c._id, count: c.count }));
  }
}

module.exports = new MenuService();
