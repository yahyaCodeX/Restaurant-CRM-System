const notificationService = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.getNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);
  ApiResponse.success(res, {
    notifications: result.notifications,
    unreadCount: result.unreadCount,
    pagination: result.pagination,
  });
});

exports.markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user._id, req.params.id);
  ApiResponse.success(res, notification, 'Notification marked as read');
});

exports.markAllAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  ApiResponse.success(res, result, result.message);
});
