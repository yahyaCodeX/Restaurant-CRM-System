const { createClient } = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        connectTimeout: 1000,
        reconnectStrategy: () => false,
      },
      password: config.redis.password || undefined,
    });

    let warnedUnavailable = false;

    redisClient.on('error', (err) => {
      if (!warnedUnavailable) {
        logger.warn(`Redis unavailable; continuing without cache: ${err.message}`);
        warnedUnavailable = true;
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    // Do not block server startup on Redis connectivity.
    redisClient.connect().catch((error) => {
      logger.warn('Redis connection failed. Running without cache:', error.message);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis initialization failed. Running without cache:', error.message);
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
