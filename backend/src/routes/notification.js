const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark single notification as read
 */
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
