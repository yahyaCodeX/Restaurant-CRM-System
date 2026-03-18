const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');

class RestaurantService {
  /**
   * Get restaurant profile for authenticated owner
   */
  async getProfile(userId) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return restaurant;
  }

  /**
   * Update restaurant profile
   */
  async updateProfile(userId, updateData) {
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) throw new AppError('Restaurant not found.', 404);

    // Only allow updating specific fields
    const allowed = [
      'name', 'description', 'cuisine', 'phone', 'whatsappNumber',
      'email', 'address', 'operatingHours', 'settings',
    ];

    allowed.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === 'address' || field === 'settings' || field === 'operatingHours') {
          restaurant[field] = { ...restaurant[field]?.toObject?.() || {}, ...updateData[field] };
        } else {
          restaurant[field] = updateData[field];
        }
      }
    });

    await restaurant.save();
    return restaurant;
  }

  /**
   * Update restaurant logo
   */
  async updateLogo(userId, imageUrl) {
    const restaurant = await Restaurant.findOneAndUpdate(
      { owner: userId },
      { logo: imageUrl },
      { new: true }
    );
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return restaurant;
  }

  /**
   * Update restaurant cover image
   */
  async updateCoverImage(userId, imageUrl) {
    const restaurant = await Restaurant.findOneAndUpdate(
      { owner: userId },
      { coverImage: imageUrl },
      { new: true }
    );
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return restaurant;
  }
}

module.exports = new RestaurantService();
