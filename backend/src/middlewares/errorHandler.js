const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  if (err.statusCode >= 500) {
    logger.error(`${err.statusCode} - ${err.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn(`${err.statusCode} - ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Development: send full error details
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // Production: handle specific error types
  let error = { ...err, message: err.message };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(messages.join('. '), 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`Duplicate value for field: ${field}`, 400);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401);
  }

  // Production response
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
};

module.exports = errorHandler;
