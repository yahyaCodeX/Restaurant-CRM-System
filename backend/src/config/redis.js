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
      },
      password: config.redis.password || undefined,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    // Do not block server startup on Redis connectivity.
    redisClient.connect().catch((error) => {
      logger.warn('Redis connection failed. Running without cache:', error.message);
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis initialization failed. Running without cache:', error.message);
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
