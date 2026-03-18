const orderService = require('../services/orderService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.getOrders = catchAsync(async (req, res) => {
  const result = await orderService.getOrders(req.user._id, req.query);
  ApiResponse.paginated(res, result.orders, result.pagination);
});

exports.getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrder(req.user._id, req.params.id);
  ApiResponse.success(res, order);
});

exports.createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  ApiResponse.created(res, order, 'Order created successfully');
});

exports.updateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, order, `Order status updated to ${order.status}`);
});

exports.getOrderStats = catchAsync(async (req, res) => {
  const stats = await orderService.getOrderStats(req.user._id);
  ApiResponse.success(res, stats);
});
