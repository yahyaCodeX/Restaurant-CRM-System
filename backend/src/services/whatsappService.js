const config = require('../config');
const twilio = require('twilio');
const Menu = require('../models/Menu');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const conversationService = require('./conversationService');

// Lazy-load Twilio client on first use
let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    twilioClient = twilio(config.whatsapp.accountSid, config.whatsapp.authToken);
  }
  return twilioClient;
};

class WhatsappService {
  /**
   * Main entry point for processing messages
   */
  async processMessage(body, options = {}) {
    try {
      const from = body.From;
      const text = body.Body?.trim();
      const sendReply = options.sendReply || this.sendMessage.bind(this);
      let lastReply = null;

      const deliver = async (messageText) => {
        lastReply = messageText;
        await sendReply(from, messageText);
      };

      if (!text) return null;

      logger.info(`[WhatsApp] Message from ${from}: ${text}`);

      // Get conversation state (use whatsappId as key)
      const customerId = from;
      let state = await conversationService.getState(customerId);

      // Backward-safe defaults for old state snapshots.
      state.orderItems = Array.isArray(state.orderItems) ? state.orderItems : [];

      logger.info(`[Dialog] Current step: ${state.step}`);

      // Parse command (menu, order, etc.)
      const command = text.toLowerCase().trim();
      let response = null;

      // Command: menu
      if (command === 'menu' || command === 'see menu' || command === 'lista' || command === 'list') {
        response = await this.handleMenuRequest(state, customerId);
        await conversationService.setState(customerId, state);
        await deliver(response);
        return { reply: lastReply, step: state.step };
      }

      // Command: cancel/reset
      if (command === 'cancel' || command === 'reset' || command === 'reset order') {
        await conversationService.clearState(customerId);
        await deliver('❌ Order cancelled. Start fresh with:\n\n"menu" - View menu\n"help" - See options');
        return { reply: lastReply, step: 'idle' };
      }

      // Command: help
      if (command === 'help' || command === 'start') {
        const helpMsg = `👋 *Welcome to Order Bot*\n\n📱 *Commands:*\n"menu" - View menu\n"cancel" - Reset\n\n*Quick order flow:*\n1) Choose restaurant\n2) Send item + quantity\n3) Send details in one message:\nName | Phone | Address`;
        await deliver(helpMsg);
        return { reply: lastReply, step: state.step };
      }

      // Route through conversation steps
      if (state.step === 'idle') {
        // User wants to explore menu or order
        response = await this.stepSelectRestaurant(text, state, customerId);
      } else if (state.step === 'selecting_restaurant') {
        // User selected restaurant, show menu
        response = await this.stepShowMenu(text, state, customerId);
      } else if (state.step === 'viewing_menu') {
        // User viewing menu, ask if they want to order
        response = await this.stepAskOrderOrMenu(text, state, customerId);
      } else if (state.step === 'collecting_details') {
        // Collect name + phone + address in one message
        response = await this.stepCollectDetails(text, state, customerId);
      } else if (state.step === 'confirming_order') {
        // Confirm and create order
        response = await this.stepConfirmOrder(text, state, customerId, from);
      }

      if (response) {
        await deliver(response);
        await conversationService.setState(customerId, state);
      }

      return { reply: lastReply, step: state.step };
    } catch (error) {
      logger.error('[WhatsApp] Message processing error:', error);
      return { reply: null, step: 'error' };
    }
  }

  /**
   * Run the same chatbot logic without calling Twilio.
   */
  async simulateMessage({ from, text }) {
    let capturedReply = null;

    const result = await this.processMessage(
      { From: from, Body: text },
      {
        sendReply: async (_to, messageText) => {
          capturedReply = messageText;
        },
      }
    );

    return {
      reply: capturedReply || result?.reply || '',
      step: result?.step || 'idle',
    };
  }

  /**
   * Step 1: Select restaurant
   */
  async stepSelectRestaurant(input, state, customerId) {
    state.step = 'selecting_restaurant';

    // Try to match restaurant name
    const restaurant = await Restaurant.findOne({
      $or: [
        { name: { $regex: input, $options: 'i' } },
      ],
      isActive: true,
    });

    if (restaurant) {
      state.restaurantId = restaurant._id.toString();
      state.restaurantName = restaurant.name;
      logger.info(`[Dialog] Selected restaurant: ${restaurant.name}`);
      return this.showMenu(restaurant._id, state, customerId);
    }

    // Show available restaurants
    const restaurants = await Restaurant.find({ isActive: true }).select('name');
    const listMsg = restaurants.length > 0
      ? `🏪 *Available Restaurants:*\n\n${restaurants.map((r, i) => `${i + 1}. ${r.name}`).join('\n')}\n\nReply with restaurant name:`
      : 'No restaurants available. Please try again later.';

    return listMsg;
  }

  /**
   * Step 2: Show menu
   */
  async stepShowMenu(input, state, customerId) {
    if (!state.restaurantId) {
      state.step = 'idle';
      return 'Please select a restaurant first. Reply with restaurant name:';
    }

    const restaurant = await Restaurant.findById(state.restaurantId);
    if (!restaurant) {
      state.step = 'idle';
      return 'Restaurant not found. Please try again.';
    }

    return this.showMenu(restaurant._id, state, customerId);
  }

  /**
   * Helper: Show menu
   */
  async showMenu(restaurantId, state, customerId) {
    const menuItems = await Menu.find({
      restaurant: restaurantId,
      isAvailable: true,
    }).select('name price category');

    if (menuItems.length === 0) {
      return '❌ No menu items available. Please try again later.';
    }

    state.step = 'viewing_menu';
    state.restaurantId = restaurantId.toString();

    const menu = menuItems
      .map((item, i) => `${i + 1}. ${item.name} - PKR ${item.price}`)
      .join('\n');

    return `🍽️ *Menu - ${state.restaurantName}*\n\n${menu}\n\n*Reply with:*\nItem name + quantity (e.g., "2 pizza" or "1 fries")\nOr "order" to checkout\nOr "menu" to update`;
  }

  /**
   * Step 3: Ask order or view menu
   */
  async stepAskOrderOrMenu(input, state, customerId) {
    const lowerInput = input.toLowerCase().trim();

    // Existing cart checkout shortcut
    if (lowerInput === 'order' || lowerInput === 'checkout' || lowerInput === 'buy') {
      if (state.orderItems.length === 0) {
        return '⚠️ Your cart is empty. Select items first (e.g., "2 pizza")';
      }
      state.step = 'collecting_details';
      return this.buildDetailsPrompt(state);
    }

    // Try to add items to order
    const restaurant = await Restaurant.findById(state.restaurantId);
    if (!restaurant) {
      state.step = 'idle';
      return 'Restaurant not found. Please start over.';
    }

    const menuItems = await Menu.find({
      restaurant: state.restaurantId,
      isAvailable: true,
    });

    const parsedItems = this.parseOrderItems(input, menuItems);

    if (parsedItems.length === 0) {
      return '❌ Item not found. Available items:\n' +
        menuItems.map(m => `• ${m.name}`).join('\n') +
        '\n\nReply with item name and quantity (e.g., "2 pizza")';
    }

    // Add items to order
    for (const item of parsedItems) {
      const existing = state.orderItems.find(oi => oi.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        state.orderItems.push(item);
      }
    }

    const orderSummary = state.orderItems
      .map(item => `${item.quantity}x ${item.name} = PKR ${item.price * item.quantity}`)
      .join('\n');

    const total = state.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    state.step = 'collecting_details';
    return `✅ *Added to order:*\n${orderSummary}\n\n💰 *Total: PKR ${total}*\n\n${this.buildDetailsPrompt(state)}`;
  }

  /**
   * Ask for all customer details in one message
   */
  buildDetailsPrompt(state) {
    return '🧾 *Send all details in ONE message:*\nName | Phone | Address\n\nExample:\nAhmad Ali | 03001234567 | House 10, Gulberg, Lahore';
  }

  /**
   * Parse one-line customer details
   */
  parseCustomerDetails(input) {
    const raw = input.trim();

    // Preferred: Name | Phone | Address
    if (raw.includes('|')) {
      const parts = raw.split('|').map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 3) {
        return {
          name: parts[0],
          phone: parts[1],
          address: parts.slice(2).join(' | '),
        };
      }
    }

    // Fallback: Name, Phone, Address
    if (raw.includes(',')) {
      const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 3) {
        return {
          name: parts[0],
          phone: parts[1],
          address: parts.slice(2).join(', '),
        };
      }
    }

    return null;
  }

  /**
   * Step 4: Collect name + phone + address in one reply
   */
  async stepCollectDetails(input, state, customerId) {
    const lowerInput = input.toLowerCase().trim();

    // Allow user to go back and add more items without resetting the flow.
    if (lowerInput === 'more' || lowerInput === 'add more' || lowerInput === 'back') {
      state.step = 'viewing_menu';
      return '🍽️ Add more items with quantity (e.g., "2 fries").';
    }

    const parsed = this.parseCustomerDetails(input);
    if (!parsed) {
      return `❌ Invalid format.\n\n${this.buildDetailsPrompt(state)}`;
    }

    const phoneDigits = parsed.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return `❌ Invalid phone number.\n\n${this.buildDetailsPrompt(state)}`;
    }

    state.customerName = parsed.name.substring(0, 100);
    state.customerPhone = parsed.phone.substring(0, 30);
    state.deliveryAddress = parsed.address.substring(0, 200);
    state.step = 'confirming_order';

    // Build confirmation message
    const orderSummary = state.orderItems
      .map(item => `${item.quantity}x ${item.name} - PKR ${item.price * item.quantity}`)
      .join('\n');

    const total = state.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const confirmMsg = `📋 *Order Summary*\n\n${orderSummary}\n\n💴 *Total: PKR ${total}*\n\n👤 ${state.customerName}\n📞 ${state.customerPhone}\n🏠 ${state.deliveryAddress}\n\n*Confirm? Reply "yes" or "no"*`;

    return confirmMsg;
  }

  /**
   * Step 7: Confirm and create order
   */
  async stepConfirmOrder(input, state, customerId, from) {
    const confirmed = input.toLowerCase().includes('yes') || input.toLowerCase().includes('ok');

    if (!confirmed) {
      state.step = 'idle';
      await conversationService.clearState(customerId);
      return '❌ Order cancelled.';
    }

    try {
      // Find or create customer
      let customer = await Customer.findOneAndUpdate(
        { whatsappId: from, restaurant: state.restaurantId },
        {
          $setOnInsert: {
            restaurant: state.restaurantId,
            whatsappId: from,
          },
          name: state.customerName,
          phone: state.customerPhone,
          address: state.deliveryAddress,
        },
        { upsert: true, new: true }
      );

      // Create order
      const order = await Order.create({
        restaurant: state.restaurantId,
        customer: customer._id,
        items: state.orderItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        subtotal: state.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        totalAmount: state.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        deliveryAddress: state.deliveryAddress,
        source: 'whatsapp',
        status: 'pending',
        whatsappMessageId: from,
      });

      // Update customer stats
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: {
          totalOrders: 1,
          totalSpent: order.totalAmount,
        },
        lastOrderDate: new Date(),
      });

      // Create notification for restaurant
      const restaurant = await Restaurant.findById(state.restaurantId);
      await Notification.create({
        restaurant: state.restaurantId,
        title: 'New WhatsApp Order',
        message: `Order #${order.orderNumber} from ${state.customerName} - PKR ${order.totalAmount}`,
        type: 'order',
        data: { orderId: order._id },
      });

      logger.info(`[Order] Created: #${order.orderNumber} for ${state.customerName}`);

      // Clear state
      await conversationService.clearState(customerId);

      const total = order.totalAmount;
      return `✅ *Order Confirmed!*\n\n📝 Order #${order.orderNumber}\n💰 PKR ${total}\n\n👤 ${state.customerName}\n📞 ${state.customerPhone}\n\nThank you! Your order has been received.\nWe'll notify you when it's ready! 🎉`;
    } catch (error) {
      logger.error('[Order] Creation failed:', error);
      state.step = 'idle';
      await conversationService.clearState(customerId);
      return '❌ Error creating order. Please try again later.';
    }
  }

  /**
   * Handle menu request
   */
  async handleMenuRequest(state, customerId) {
    if (!state.restaurantId) {
      // Show restaurants
      const restaurants = await Restaurant.find({ isActive: true }).select('name');
      return restaurants.length > 0
        ? `🏪 *Restaurants:*\n\n${restaurants.map(r => `• ${r.name}`).join('\n')}\n\nReply with restaurant name:`
        : 'No restaurants available.';
    }

    // Show menu for existing restaurant
    const restaurant = await Restaurant.findById(state.restaurantId);
    return this.showMenu(restaurant._id, state, customerId);
  }

  /**
   * Parse order items from user input
   */
  parseOrderItems(input, menuItems) {
    const items = [];
    const lowerInput = input.toLowerCase();

    for (const menuItem of menuItems) {
      const itemNameLower = menuItem.name.toLowerCase();

      if (lowerInput.includes(itemNameLower)) {
        // Try to extract quantity
        const regex = new RegExp(`(\\d+)\\s*(?:x|×|\\*)?\\s*${itemNameLower.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'i');
        const match = lowerInput.match(regex);
        const quantity = match ? parseInt(match[1]) : 1;

        items.push({
          name: menuItem.name,
          price: menuItem.price,
          quantity,
        });
      }
    }

    return items;
  }

  /**
   * Send WhatsApp message via Twilio API
   */
  async sendMessage(to, text) {
    try {
      logger.info(`[Twilio] Sending to ${to}: ${text.substring(0, 50)}...`);

      const client = getTwilioClient();
      const message = await client.messages.create({
        body: text,
        from: config.whatsapp.whatsappNumber,
        to: to,
      });

      logger.info(`[Twilio] Message sent: ${message.sid}`);
      return message.sid;
    } catch (error) {
      logger.error('[Twilio] Send failed:', {
        message: error.message,
        code: error.code,
        to,
      });
      throw error;
    }
  }

  /**
   * Verify webhook (no-op for Twilio)
   */
  verifyWebhook() {
    return true;
  }
}

module.exports = new WhatsappService();
