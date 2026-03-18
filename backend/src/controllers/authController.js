const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const config = require('../config');
const passport = require('passport');

exports.signup = catchAsync(async (req, res) => {
  const result = await authService.signup(req.body);
  ApiResponse.created(res, result, result.message);
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  ApiResponse.success(res, result, 'Login successful');
});

exports.verifyEmail = catchAsync(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);
  ApiResponse.success(res, result, result.message);
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  ApiResponse.success(res, result, result.message);
});

exports.resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(req.params.token, req.body.password);
  ApiResponse.success(res, result, result.message);
});

exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
  ApiResponse.success(res, result, result.message);
});

exports.refreshToken = catchAsync(async (req, res) => {
  const token = req.body.refreshToken || req.cookies.refreshToken;
  const result = await authService.refreshTokens(token);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  ApiResponse.success(res, result);
});

exports.logout = catchAsync(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie('refreshToken');
  ApiResponse.success(res, null, 'Logged out successfully');
});

exports.getMe = catchAsync(async (req, res) => {
  ApiResponse.success(res, { user: req.user });
});

// Google OAuth
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

exports.googleCallback = catchAsync(async (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
    }

    const result = await authService.handleGoogleAuth(user);

    // Redirect to frontend with tokens
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${config.frontendUrl}/auth/callback?token=${result.accessToken}`);
  })(req, res, next);
});
