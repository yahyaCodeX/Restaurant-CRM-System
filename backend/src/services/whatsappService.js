const config = require('../config');
const Menu = require('../models/Menu');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class WhatsappService {
  /**
   * Verify webhook (Meta requirement)
   */
  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Process incoming WhatsApp message
   */
  async processMessage(body) {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      if (!message) return null;

      const from = message.from; // Customer phone number
      const text = message.text?.body;

      if (!text) return null;

      logger.info(`WhatsApp message from ${from}: ${text}`);

      // Find restaurant by WhatsApp number
      const waNumber = changes?.value?.metadata?.display_phone_number;
      const restaurant = await Restaurant.findOne({ whatsappNumber: waNumber });

      if (!restaurant) {
        logger.warn(`No restaurant found for WhatsApp number: ${waNumber}`);
        await this.sendMessage(from, 'Sorry, this restaurant is not registered in our system.');
        return null;
      }

      // Get menu items for context
      const menuItems = await Menu.find({ restaurant: restaurant._id, isAvailable: true })
        .select('name price category');

      // Process with AI
      const orderData = await this.processWithAI(text, menuItems);

      if (!orderData || !orderData.items || orderData.items.length === 0) {
        await this.sendMessage(from, 
          'Sorry, I could not understand your order. Please try again. Example:\n"2 chicken biryani aur ek burger"'
        );
        return null;
      }

      // Create confirmation message
      const confirmMessage = this.createConfirmationMessage(orderData, restaurant);
      await this.sendMessage(from, confirmMessage);

      // Find or create customer
      const customer = await Customer.findOneAndUpdate(
        { restaurant: restaurant._id, phone: from },
        {
          $setOnInsert: {
            restaurant: restaurant._id,
            name: `WhatsApp - ${from}`,
            phone: from,
            whatsappId: from,
          },
        },
        { upsert: true, new: true }
      );

      // Create order
      const order = await Order.create({
        restaurant: restaurant._id,
        customer: customer._id,
        items: orderData.items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        subtotal: orderData.totalPrice,
        totalAmount: orderData.totalPrice,
        customerName: customer.name,
        customerPhone: from,
        source: 'whatsapp',
        status: 'pending',
        whatsappMessageId: message.id,
      });

      // Update customer stats
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: { totalOrders: 1, totalSpent: orderData.totalPrice },
        lastOrderDate: new Date(),
      });

      // Create notification
      await Notification.create({
        restaurant: restaurant._id,
        title: 'New WhatsApp Order',
        message: `Order #${order.orderNumber} from ${from} - PKR ${orderData.totalPrice}`,
        type: 'order',
        data: { orderId: order._id },
      });

      return order;
    } catch (error) {
      logger.error('WhatsApp message processing error:', error);
      return null;
    }
  }

  /**
   * Process message with AI (Llama / OpenAI compatible)
   */
  async processWithAI(message, menuItems) {
    try {
      const menuContext = menuItems
        .map((item) => `${item.name}: PKR ${item.price}`)
        .join('\n');

      const prompt = `You are an AI order assistant for a restaurant. The customer sent a message in Roman Urdu or English.

Available menu items:
${menuContext}

Customer message: "${message}"

Extract the order from the message. Match items to the menu. If an item doesn't match exactly, find the closest match.

Respond ONLY with a JSON object in this format:
{
  "items": [
    {"name": "item name from menu", "price": price, "quantity": number}
  ],
  "totalPrice": total
}

If you cannot extract any order items, respond with: {"items": [], "totalPrice": 0}`;

      const response = await fetch(config.ai.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.ai.apiKey}`,
        },
        body: JSON.stringify({
          model: config.ai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI order assistant for a restaurant. Always reply ONLY with valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('AI API error:', response.statusText, errorText);
        return this.fallbackParser(message, menuItems);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      return result;
    } catch (error) {
      logger.warn('AI processing failed, using fallback parser:', error.message);
      return this.fallbackParser(message, menuItems);
    }
  }

  /**
   * Fallback parser when AI is unavailable
   */
  fallbackParser(message, menuItems) {
    const items = [];
    const lowerMessage = message.toLowerCase();

    for (const menuItem of menuItems) {
      const itemName = menuItem.name.toLowerCase();
      if (lowerMessage.includes(itemName)) {
        // Try to find quantity
        const regex = new RegExp(`(\\d+)\\s*(?:x\\s*)?${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
        const match = lowerMessage.match(regex);
        const quantity = match ? parseInt(match[1]) : 1;

        items.push({
          name: menuItem.name,
          price: menuItem.price,
          quantity,
        });
      }
    }

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { items, totalPrice };
  }

  /**
   * Create order confirmation message
   */
  createConfirmationMessage(orderData, restaurant) {
    let message = `✅ *Order Confirmed - ${restaurant.name}*\n\n`;
    message += `📋 *Order Details:*\n`;

    orderData.items.forEach((item, i) => {
      message += `${i + 1}. ${item.name} x${item.quantity} — PKR ${item.price * item.quantity}\n`;
    });

    message += `\n💰 *Total: PKR ${orderData.totalPrice}*\n`;
    message += `\nYour order is being processed. We'll notify you when it's ready! 🍔`;

    return message;
  }

  /**
   * Send WhatsApp message via Meta API
   */
  async sendMessage(to, text) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.whatsapp.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.whatsapp.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error('WhatsApp send error:', error);
      }
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error.message);
    }
  }
}

module.exports = new WhatsappService();
