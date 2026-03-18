const Joi = require('joi');

const updateRestaurant = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(200).optional(),
    description: Joi.string().trim().max(1000).allow('').optional(),
    cuisine: Joi.array().items(Joi.string().trim()).optional(),
    phone: Joi.string().trim().optional(),
    whatsappNumber: Joi.string().trim().optional(),
    email: Joi.string().email().allow('').optional(),
    address: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      zipCode: Joi.string().trim().optional(),
      country: Joi.string().trim().optional(),
    }).optional(),
    operatingHours: Joi.object().optional(),
    settings: Joi.object({
      currency: Joi.string().trim().optional(),
      taxRate: Joi.number().min(0).max(100).optional(),
      deliveryFee: Joi.number().min(0).optional(),
      minimumOrder: Joi.number().min(0).optional(),
      autoAcceptOrders: Joi.boolean().optional(),
    }).optional(),
  }),
};

module.exports = { updateRestaurant };
