const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const { seedAdmin } = require('./services/adminSeeder');

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis (non-blocking)
    await connectRedis();

    // Seed admin user
    await seedAdmin();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running in ${config.env} mode on port ${config.port}`);
      logger.info(`📚 API Docs: http://localhost:${config.port}/api-docs`);
      logger.info(`❤️  Health:   http://localhost:${config.port}/api/v1/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled rejection
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION:', err);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Uncaught exception
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION:', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
