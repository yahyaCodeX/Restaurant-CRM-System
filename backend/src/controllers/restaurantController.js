const restaurantService = require('../services/restaurantService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');

exports.getProfile = catchAsync(async (req, res) => {
  const restaurant = await restaurantService.getProfile(req.user._id);
  ApiResponse.success(res, restaurant);
});

exports.updateProfile = catchAsync(async (req, res) => {
  const restaurant = await restaurantService.updateProfile(req.user._id, req.body);
  ApiResponse.success(res, restaurant, 'Profile updated successfully');
});

exports.updateLogo = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded.', 400);
  }
  const restaurant = await restaurantService.updateLogo(req.user._id, req.file.path);
  ApiResponse.success(res, restaurant, 'Logo updated successfully');
});

exports.updateCoverImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded.', 400);
  }
  const restaurant = await restaurantService.updateCoverImage(req.user._id, req.file.path);
  ApiResponse.success(res, restaurant, 'Cover image updated successfully');
});
