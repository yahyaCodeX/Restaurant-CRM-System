const AppError = require('../utils/AppError');

/**
 * Middleware factory for Joi validation
 * @param {Object} schema - Joi schema object with body, params, query keys
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    ['body', 'params', 'query'].forEach((key) => {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          error.details.forEach((detail) => {
            errors.push(detail.message.replace(/"/g, ''));
          });
        } else {
          req[key] = value;
        }
      }
    });

    if (errors.length > 0) {
      return next(new AppError(errors.join('. '), 400));
    }

    next();
  };
};

module.exports = validate;
