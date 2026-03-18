const router = require('express').Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const authValidators = require('../validators/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new restaurant owner
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, restaurantName, restaurantPhone]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               restaurantName:
 *                 type: string
 *               restaurantPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error or duplicate email
 */
router.post('/signup', validate(authValidators.signup), authController.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validate(authValidators.login), authController.login);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Verify email address
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post('/forgot-password', validate(authValidators.forgotPassword), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password
 *     security: []
 */
router.post('/reset-password/:token', validate(authValidators.resetPassword), authController.resetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     tags: [Auth]
 *     summary: Change password (authenticated)
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put('/change-password', protect, validate(authValidators.changePassword), authController.changePassword);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and invalidate tokens
 */
router.post('/logout', protect, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 */
router.get('/me', protect, authController.getMe);

// Google OAuth
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

module.exports = router;
