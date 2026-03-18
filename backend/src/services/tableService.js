const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');

class TableService {
  async _getRestaurantId(userId) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return restaurant._id;
  }

  /**
   * Get all tables
   */
  async getTables(userId) {
    const restaurantId = await this._getRestaurantId(userId);
    const tables = await Table.find({ restaurant: restaurantId })
      .populate('currentOrder', 'orderNumber status totalAmount')
      .sort({ tableNumber: 1 });
    return tables;
  }

  /**
   * Add a new table
   */
  async addTable(userId, data) {
    const restaurantId = await this._getRestaurantId(userId);

    // Check if table number already exists
    const existing = await Table.findOne({ restaurant: restaurantId, tableNumber: data.tableNumber });
    if (existing) {
      throw new AppError(`Table #${data.tableNumber} already exists.`, 400);
    }

    const table = await Table.create({
      restaurant: restaurantId,
      tableNumber: data.tableNumber,
      capacity: data.capacity || 4,
      location: data.location || 'indoor',
    });

    return table;
  }

  /**
   * Update table
   */
  async updateTable(userId, tableId, data) {
    const restaurantId = await this._getRestaurantId(userId);
    const table = await Table.findOneAndUpdate(
      { _id: tableId, restaurant: restaurantId },
      data,
      { new: true, runValidators: true }
    );
    if (!table) throw new AppError('Table not found.', 404);
    return table;
  }

  /**
   * Remove table
   */
  async removeTable(userId, tableId) {
    const restaurantId = await this._getRestaurantId(userId);
    const table = await Table.findOne({ _id: tableId, restaurant: restaurantId });
    if (!table) throw new AppError('Table not found.', 404);

    if (table.isOccupied) {
      throw new AppError('Cannot remove an occupied table.', 400);
    }

    await Table.findByIdAndDelete(tableId);
    return { message: 'Table removed successfully.' };
  }

  /**
   * Toggle table status
   */
  async toggleStatus(userId, tableId) {
    const restaurantId = await this._getRestaurantId(userId);
    const table = await Table.findOne({ _id: tableId, restaurant: restaurantId });
    if (!table) throw new AppError('Table not found.', 404);

    table.isOccupied = !table.isOccupied;
    table.status = table.isOccupied ? 'occupied' : 'available';
    if (!table.isOccupied) {
      table.currentOrder = undefined;
    }
    await table.save();

    return table;
  }
}

module.exports = new TableService();
