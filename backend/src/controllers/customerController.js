const customerService = require('../services/customerService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.getCustomers = catchAsync(async (req, res) => {
  const result = await customerService.getCustomers(req.user._id, req.query);
  ApiResponse.paginated(res, result.customers, result.pagination);
});

exports.getCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomer(req.user._id, req.params.id);
  ApiResponse.success(res, customer);
});

exports.createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.user._id, req.body);
  ApiResponse.created(res, customer, 'Customer created successfully');
});

exports.updateCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.updateCustomer(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, customer, 'Customer updated successfully');
});

exports.deleteCustomer = catchAsync(async (req, res) => {
  const result = await customerService.deleteCustomer(req.user._id, req.params.id);
  ApiResponse.success(res, result, result.message);
});

exports.getCustomerHistory = catchAsync(async (req, res) => {
  const result = await customerService.getCustomerHistory(req.user._id, req.params.id);
  ApiResponse.success(res, result);
});
