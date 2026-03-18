const Joi = require('joi');

const createCustomer = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    phone: Joi.string().trim().required(),
    email: Joi.string().email().allow('').optional(),
    address: Joi.string().trim().max(500).optional(),
    notes: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
  }),
};

const updateCustomer = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    phone: Joi.string().trim().optional(),
    email: Joi.string().email().allow('').optional(),
    address: Joi.string().trim().max(500).optional(),
    notes: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    isActive: Joi.boolean().optional(),
  }),
};

module.exports = { createCustomer, updateCustomer };
