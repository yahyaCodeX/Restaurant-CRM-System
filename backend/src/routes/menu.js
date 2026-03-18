const router = require('express').Router();
const menuController = require('../controllers/menuController');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const menuValidators = require('../validators/menu');

router.use(protect);
router.use(authorize('restaurant_owner'));
router.use(requireApproval);

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu management
 */

/**
 * @swagger
 * /restaurant/menu:
 *   get:
 *     tags: [Menu]
 *     summary: Get all menu items
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *   post:
 *     tags: [Menu]
 *     summary: Create a new menu item
 */
router.get('/', menuController.getMenuItems);
router.post('/', validate(menuValidators.createMenu), menuController.createMenuItem);

/**
 * @swagger
 * /restaurant/menu/categories:
 *   get:
 *     tags: [Menu]
 *     summary: Get menu categories with item counts
 */
router.get('/categories', menuController.getCategories);

/**
 * @swagger
 * /restaurant/menu/{id}:
 *   get:
 *     tags: [Menu]
 *     summary: Get a single menu item
 *   put:
 *     tags: [Menu]
 *     summary: Update a menu item
 *   delete:
 *     tags: [Menu]
 *     summary: Delete a menu item
 */
router.get('/:id', menuController.getMenuItem);
router.put('/:id', validate(menuValidators.updateMenu), menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

/**
 * @swagger
 * /restaurant/menu/{id}/image:
 *   put:
 *     tags: [Menu]
 *     summary: Upload menu item image
 */
router.put('/:id/image', uploadLimiter, upload.single('image'), menuController.updateMenuImage);

/**
 * @swagger
 * /restaurant/menu/{id}/toggle:
 *   put:
 *     tags: [Menu]
 *     summary: Toggle menu item availability
 */
router.put('/:id/toggle', menuController.toggleAvailability);

module.exports = router;
