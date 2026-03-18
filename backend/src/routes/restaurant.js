const router = require('express').Router();
const restaurantController = require('../controllers/restaurantController');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const restaurantValidators = require('../validators/restaurant');

// All restaurant routes require auth + restaurant_owner role + approval
router.use(protect);
router.use(authorize('restaurant_owner'));
router.use(requireApproval);

/**
 * @swagger
 * tags:
 *   name: Restaurant
 *   description: Restaurant profile management
 */

/**
 * @swagger
 * /restaurant/profile:
 *   get:
 *     tags: [Restaurant]
 *     summary: Get restaurant profile
 */
router.get('/profile', restaurantController.getProfile);

/**
 * @swagger
 * /restaurant/profile:
 *   put:
 *     tags: [Restaurant]
 *     summary: Update restaurant profile
 */
router.put('/profile', validate(restaurantValidators.updateRestaurant), restaurantController.updateProfile);

/**
 * @swagger
 * /restaurant/logo:
 *   put:
 *     tags: [Restaurant]
 *     summary: Upload restaurant logo
 */
router.put('/logo', uploadLimiter, upload.single('logo'), restaurantController.updateLogo);

/**
 * @swagger
 * /restaurant/cover:
 *   put:
 *     tags: [Restaurant]
 *     summary: Upload restaurant cover image
 */
router.put('/cover', uploadLimiter, upload.single('coverImage'), restaurantController.updateCoverImage);

module.exports = router;
