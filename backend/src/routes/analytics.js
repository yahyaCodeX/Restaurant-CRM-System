const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize, requireApproval } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('restaurant_owner'));
router.use(requireApproval);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Sales analytics
 */

/**
 * @swagger
 * /restaurant/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Get sales analytics
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 */
router.get('/', analyticsController.getSalesAnalytics);

/**
 * @swagger
 * /restaurant/analytics/daily:
 *   get:
 *     tags: [Analytics]
 *     summary: Get daily sales data for charting
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 */
router.get('/daily', analyticsController.getDailySales);

module.exports = router;
