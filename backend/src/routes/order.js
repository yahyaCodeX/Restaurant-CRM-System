const router = require('express').Router();
const orderController = require('../controllers/orderController');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const orderValidators = require('../validators/order');

router.use(protect);
router.use(authorize('restaurant_owner'));
router.use(requireApproval);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /restaurant/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [whatsapp, manual, dashboard, phone]
 */
router.get('/', orderController.getOrders);

/**
 * @swagger
 * /restaurant/orders/stats:
 *   get:
 *     tags: [Orders]
 *     summary: Get order statistics
 */
router.get('/stats', orderController.getOrderStats);

/**
 * @swagger
 * /restaurant/orders/manual:
 *   post:
 *     tags: [Orders]
 *     summary: Create a manual order
 */
router.post('/manual', validate(orderValidators.createOrder), orderController.createOrder);

/**
 * @swagger
 * /restaurant/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get single order details
 */
router.get('/:id', orderController.getOrder);

/**
 * @swagger
 * /restaurant/orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Update order status
 */
router.put('/:id/status', validate(orderValidators.updateOrderStatus), orderController.updateOrderStatus);

module.exports = router;
