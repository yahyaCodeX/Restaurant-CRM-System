const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const AppError = require('../utils/AppError');
const { sendEmail, emailTemplates } = require('../utils/email');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Generate JWT access token
   */
  generateAccessToken(userId) {
    return jwt.sign({ id: userId }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
    });
  }

  /**
   * Signup - register new restaurant owner
   */
  async signup({ name, email, password, phone, restaurantName, restaurantPhone, restaurantAddress }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone: phone != null ? String(phone) : undefined,
      role: 'restaurant_owner',
    });

    // Create restaurant
    await Restaurant.create({
      owner: user._id,
      name: restaurantName,
      phone: restaurantPhone != null ? String(restaurantPhone) : undefined,
      address: restaurantAddress || {},
    });

    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verifyUrl = `${config.frontendUrl}/verify-email/${verificationToken}`;
    const template = emailTemplates.verifyEmail(name, verifyUrl);

    try {
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      logger.warn('Failed to send verification email:', error.message);
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Registration successful. Please verify your email and wait for admin approval.',
    };
  }

  /**
   * Login
   */
  async login(email, password) {
    // Find user with password
    const user = await User.findOne({ email }).select('+password +isApproved');

    if (!user || !user.password) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Check lock
    if (user.isLocked()) {
      throw new AppError('Account is temporarily locked due to too many failed attempts. Try again later.', 423);
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
      }
      await user.save({ validateBeforeSave: false });
      throw new AppError('Invalid email or password.', 401);
    }

    // Check if approved (restaurant owners only)
    if (user.role === 'restaurant_owner' && !user.isApproved) {
      throw new AppError('Your account is pending admin approval.', 403);
    }

    // Check if active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact support.', 403);
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    };
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token.', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return { message: 'Email verified successfully.' };
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
    const template = emailTemplates.resetPassword(user.name, resetUrl);

    try {
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError('Failed to send reset email. Please try again later.', 500);
    }

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token.', 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined;
    await user.save();

    return { message: 'Password reset successful. Please log in with your new password.' };
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 401);
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    // Generate new tokens
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken, message: 'Password changed successfully.' };
  }

  /**
   * Refresh token
   */
  async refreshTokens(token) {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token. Please log in again.', 401);
    }

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  }

  /**
   * Logout
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: undefined });
    return { message: 'Logged out successfully.' };
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleAuth(user) {
    // Generate tokens
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Check if restaurant exists, create one if not
    let restaurant = await Restaurant.findOne({ owner: user._id });
    if (!restaurant) {
      restaurant = await Restaurant.create({
        owner: user._id,
        name: `${user.name}'s Restaurant`,
        phone: user.phone || 'Not provided',
      });
    }

    return { accessToken, refreshToken, user };
  }
}

module.exports = new AuthService();
