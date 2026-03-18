const menuService = require('../services/menuService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');

exports.getMenuItems = catchAsync(async (req, res) => {
  const result = await menuService.getMenuItems(req.user._id, req.query);
  ApiResponse.paginated(res, result.items, result.pagination);
});

exports.getMenuItem = catchAsync(async (req, res) => {
  const item = await menuService.getMenuItem(req.user._id, req.params.id);
  ApiResponse.success(res, item);
});

exports.createMenuItem = catchAsync(async (req, res) => {
  const item = await menuService.createMenuItem(req.user._id, req.body);
  ApiResponse.created(res, item, 'Menu item created successfully');
});

exports.updateMenuItem = catchAsync(async (req, res) => {
  const item = await menuService.updateMenuItem(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, item, 'Menu item updated successfully');
});

exports.deleteMenuItem = catchAsync(async (req, res) => {
  const result = await menuService.deleteMenuItem(req.user._id, req.params.id);
  ApiResponse.success(res, result, result.message);
});

exports.updateMenuImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded.', 400);
  }
  const item = await menuService.updateMenuImage(req.user._id, req.params.id, req.file.path);
  ApiResponse.success(res, item, 'Image updated successfully');
});

exports.toggleAvailability = catchAsync(async (req, res) => {
  const item = await menuService.toggleAvailability(req.user._id, req.params.id);
  ApiResponse.success(res, item, `Item is now ${item.isAvailable ? 'available' : 'unavailable'}`);
});

exports.getCategories = catchAsync(async (req, res) => {
  const categories = await menuService.getCategories(req.user._id);
  ApiResponse.success(res, categories);
});
