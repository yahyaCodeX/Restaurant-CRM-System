const Joi = require('joi');

const signup = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain at least one lowercase, one uppercase, and one digit'),
    // Accept phone as string or number and normalize later
    phone: Joi.alternatives()
      .try(Joi.string().trim(), Joi.number())
      .optional(),
    restaurantName: Joi.string().trim().min(2).max(200).required(),
    restaurantPhone: Joi.alternatives()
      .try(Joi.string().trim(), Joi.number())
      .required(),
    restaurantAddress: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      zipCode: Joi.string().trim().optional(),
      country: Joi.string().trim().optional(),
    }).optional(),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  params: Joi.object({
    token: Joi.string().required(),
  }),
  body: Joi.object({
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain at least one lowercase, one uppercase, and one digit'),
  }),
};

const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain at least one lowercase, one uppercase, and one digit'),
  }),
};

const refreshToken = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
};
