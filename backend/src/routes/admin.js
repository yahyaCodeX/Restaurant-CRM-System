const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin panel endpoints
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform dashboard metrics
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @swagger
 * /admin/restaurants:
 *   get:
 *     tags: [Admin]
 *     summary: Get all restaurants with filters
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, suspended, rejected]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of restaurants
 */
router.get('/restaurants', adminController.getRestaurants);

/**
 * @swagger
 * /admin/restaurants/{id}/approve:
 *   put:
 *     tags: [Admin]
 *     summary: Approve a restaurant registration
 */
router.put('/restaurants/:id/approve', adminController.approveRestaurant);

/**
 * @swagger
 * /admin/restaurants/{id}/reject:
 *   put:
 *     tags: [Admin]
 *     summary: Reject a restaurant registration
 */
router.put('/restaurants/:id/reject', adminController.rejectRestaurant);

/**
 * @swagger
 * /admin/restaurants/{id}/suspend:
 *   put:
 *     tags: [Admin]
 *     summary: Suspend a restaurant
 */
router.put('/restaurants/:id/suspend', adminController.suspendRestaurant);

/**
 * @swagger
 * /admin/restaurants/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Remove a restaurant permanently
 */
router.delete('/restaurants/:id', adminController.removeRestaurant);

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get audit logs
 */
router.get('/logs', adminController.getAuditLogs);

module.exports = router;
