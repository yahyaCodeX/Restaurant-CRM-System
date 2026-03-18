const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.getRestaurants = catchAsync(async (req, res) => {
  const result = await adminService.getRestaurants(req.query);
  ApiResponse.paginated(res, result.restaurants, result.pagination);
});

exports.approveRestaurant = catchAsync(async (req, res) => {
  const restaurant = await adminService.approveRestaurant(req.params.id, req.user._id, req);
  ApiResponse.success(res, restaurant, 'Restaurant approved successfully');
});

exports.rejectRestaurant = catchAsync(async (req, res) => {
  const restaurant = await adminService.rejectRestaurant(req.params.id, req.user._id, req.body.reason, req);
  ApiResponse.success(res, restaurant, 'Restaurant rejected');
});

exports.suspendRestaurant = catchAsync(async (req, res) => {
  const restaurant = await adminService.suspendRestaurant(req.params.id, req.user._id, req.body.reason, req);
  ApiResponse.success(res, restaurant, 'Restaurant suspended');
});

exports.removeRestaurant = catchAsync(async (req, res) => {
  const result = await adminService.removeRestaurant(req.params.id, req.user._id, req);
  ApiResponse.success(res, result, result.message);
});

exports.getDashboard = catchAsync(async (req, res) => {
  const metrics = await adminService.getDashboardMetrics();
  ApiResponse.success(res, metrics);
});

exports.getAuditLogs = catchAsync(async (req, res) => {
  const result = await adminService.getAuditLogs(req.query);
  ApiResponse.paginated(res, result.logs, result.pagination);
});
