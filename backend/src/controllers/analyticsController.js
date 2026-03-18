const analyticsService = require('../services/analyticsService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.getSalesAnalytics = catchAsync(async (req, res) => {
  const result = await analyticsService.getSalesAnalytics(req.user._id, req.query);
  ApiResponse.success(res, result);
});

exports.getDailySales = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const result = await analyticsService.getDailySales(req.user._id, days);
  ApiResponse.success(res, result);
});
