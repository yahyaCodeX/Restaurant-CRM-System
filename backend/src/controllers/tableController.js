const tableService = require('../services/tableService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.getTables = catchAsync(async (req, res) => {
  const tables = await tableService.getTables(req.user._id);
  ApiResponse.success(res, tables);
});

exports.addTable = catchAsync(async (req, res) => {
  const table = await tableService.addTable(req.user._id, req.body);
  ApiResponse.created(res, table, 'Table added successfully');
});

exports.updateTable = catchAsync(async (req, res) => {
  const table = await tableService.updateTable(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, table, 'Table updated successfully');
});

exports.removeTable = catchAsync(async (req, res) => {
  const result = await tableService.removeTable(req.user._id, req.params.id);
  ApiResponse.success(res, result, result.message);
});

exports.toggleStatus = catchAsync(async (req, res) => {
  const table = await tableService.toggleStatus(req.user._id, req.params.id);
  ApiResponse.success(res, table, `Table is now ${table.status}`);
});
