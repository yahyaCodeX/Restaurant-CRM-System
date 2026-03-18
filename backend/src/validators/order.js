const Joi = require('joi');

const createOrder = {
  body: Joi.object({
    items: Joi.array().items(
      Joi.object({
        menuItem: Joi.string().optional(),
        name: Joi.string().trim().required(),
        price: Joi.number().min(0).required(),
        quantity: Joi.number().integer().min(1).required(),
        variation: Joi.string().trim().optional(),
        specialInstructions: Joi.string().max(300).optional(),
      })
    ).min(1).required(),
    customer: Joi.string().optional(),
    customerName: Joi.string().trim().optional(),
    customerPhone: Joi.string().trim().optional(),
    customerAddress: Joi.string().trim().when('orderType', {
      is: 'delivery',
      then: Joi.string().trim().required(),
      otherwise: Joi.string().trim().optional(),
    }),
    table: Joi.string().optional(),
    orderType: Joi.string().valid('dine_in', 'takeaway', 'delivery').optional(),
    paymentMethod: Joi.string().valid('cash', 'card', 'online', 'other').optional(),
    discount: Joi.number().min(0).optional(),
    notes: Joi.string().max(500).optional(),
    source: Joi.string().valid('manual', 'dashboard', 'phone').optional(),
  }),
};

const updateOrderStatus = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('confirmed', 'preparing', 'ready', 'delivered', 'cancelled').required(),
    cancelReason: Joi.string().when('status', {
      is: 'cancelled',
      then: Joi.string().required(),
      otherwise: Joi.string().optional(),
    }),
    estimatedDeliveryTime: Joi.date().optional(),
  }),
};

module.exports = { createOrder, updateOrderStatus };
