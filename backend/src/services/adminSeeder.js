const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (!existingAdmin) {
      await User.create({
        name: 'Platform Admin',
        email: config.admin.email,
        password: config.admin.password,
        role: 'admin',
        isApproved: true,
        isEmailVerified: true,
        isActive: true,
      });
      logger.info(`Admin user seeded: ${config.admin.email}`);
    } else {
      logger.debug('Admin user already exists, skipping seed');
    }
  } catch (error) {
    logger.error('Failed to seed admin user:', error.message);
  }
};

module.exports = { seedAdmin };
