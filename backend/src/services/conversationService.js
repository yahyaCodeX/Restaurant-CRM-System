const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

// In-memory store fallback (for when Redis is unavailable)
const memoryStore = new Map();

class ConversationService {
  constructor() {
    this.redisClient = null;
    this.redisDisabled = false;
    this.redisWarned = false;
    this.initializeRedis();
  }

  initializeRedis() {
    try {
      if (this.redisDisabled) return;

      this.redisClient = redis.createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          connectTimeout: 1000,
          reconnectStrategy: () => false,
        },
        password: config.redis.password || undefined,
      });

      this.redisClient.on('error', (err) => {
        if (!this.redisWarned) {
          logger.warn(`Redis unavailable, using memory store: ${err.message}`);
          this.redisWarned = true;
        }
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected for conversation state');
      });

      this.redisClient.connect().catch((error) => {
        logger.warn(`Redis connect failed, memory store enabled: ${error.message}`);
        this.redisDisabled = true;
        this.redisClient = null;
      });
    } catch (error) {
      logger.warn('Could not initialize Redis:', error.message);
      this.redisClient = null;
    }
  }

  /**
   * Get conversation state for a customer
   */
  async getState(customerId) {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        const state = await this.redisClient.get(`conversation:${customerId}`);
        return state ? JSON.parse(state) : this.getDefaultState();
      } else {
        return memoryStore.get(customerId) || this.getDefaultState();
      }
    } catch (error) {
      logger.warn(`Could not get state from Redis: ${error.message}`);
      return memoryStore.get(customerId) || this.getDefaultState();
    }
  }

  /**
   * Save conversation state
   */
  async setState(customerId, state) {
    try {
      const ttl = 24 * 60 * 60; // 24 hours

      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.setEx(
          `conversation:${customerId}`,
          ttl,
          JSON.stringify(state)
        );
      } else {
        memoryStore.set(customerId, state);
      }
    } catch (error) {
      logger.warn(`Could not save state to Redis: ${error.message}`);
      memoryStore.set(customerId, state);
    }
  }

  /**
   * Default state structure
   */
  getDefaultState() {
    return {
      step: 'idle', // idle, selecting_restaurant, viewing_menu, collecting_details, confirming_order
      restaurantId: null,
      restaurantName: null,
      orderItems: [],
      customerName: null,
      customerPhone: null,
      deliveryAddress: null,
      orderType: null, // 'delivery' or 'pickup'
      createdAt: new Date(),
    };
  }

  /**
   * Clear conversation state
   */
  async clearState(customerId) {
    try {
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.del(`conversation:${customerId}`);
      }
      memoryStore.delete(customerId);
    } catch (error) {
      logger.warn(`Could not clear state from Redis: ${error.message}`);
      memoryStore.delete(customerId);
    }
  }
}

module.exports = new ConversationService();
