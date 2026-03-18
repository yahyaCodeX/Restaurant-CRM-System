const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Protect routes - verify JWT token
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  // Verify token
  const decoded = jwt.verify(token, config.jwt.accessSecret);

  // Check if user still exists
  const user = await User.findById(decoded.id).select('+isApproved');
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Check if user changed password after token was issued
  if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
    return next(new AppError('Password recently changed. Please log in again.', 401));
  }

  req.user = user;
  next();
});

/**
 * Restrict to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Check if restaurant owner is approved
 */
const requireApproval = (req, res, next) => {
  if (req.user.role === 'restaurant_owner' && !req.user.isApproved) {
    return next(new AppError('Your account is pending admin approval.', 403));
  }
  next();
};

module.exports = { protect, authorize, requireApproval };
