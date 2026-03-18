const Joi = require('joi');

const createMenu = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().max(500).optional(),
    price: Joi.number().min(0).required(),
    category: Joi.string().valid(
      'appetizers', 'main_course', 'desserts', 'beverages',
      'soups', 'salads', 'sides', 'specials', 'breakfast',
      'lunch', 'dinner', 'snacks', 'biryani', 'karahi',
      'bbq', 'fast_food', 'chinese', 'other'
    ).required(),
    isAvailable: Joi.boolean().optional(),
    isPopular: Joi.boolean().optional(),
    preparationTime: Joi.number().min(1).optional(),
    allergens: Joi.array().items(Joi.string().trim()).optional(),
    variations: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().required(),
        price: Joi.number().min(0).required(),
      })
    ).optional(),
  }),
};

const updateMenu = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(200).optional(),
    description: Joi.string().trim().max(500).allow('').optional(),
    price: Joi.number().min(0).optional(),
    category: Joi.string().valid(
      'appetizers', 'main_course', 'desserts', 'beverages',
      'soups', 'salads', 'sides', 'specials', 'breakfast',
      'lunch', 'dinner', 'snacks', 'biryani', 'karahi',
      'bbq', 'fast_food', 'chinese', 'other'
    ).optional(),
    isAvailable: Joi.boolean().optional(),
    isPopular: Joi.boolean().optional(),
    preparationTime: Joi.number().min(1).optional(),
    allergens: Joi.array().items(Joi.string().trim()).optional(),
    variations: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().required(),
        price: Joi.number().min(0).required(),
      })
    ).optional(),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
};

module.exports = { createMenu, updateMenu };
