const router = require('express').Router();
const customerController = require('../controllers/customerController');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const customerValidators = require('../validators/customer');

router.use(protect);
router.use(authorize('restaurant_owner'));
router.use(requireApproval);

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

/**
 * @swagger
 * /restaurant/customers:
 *   get:
 *     tags: [Customers]
 *     summary: Get all customers
 *   post:
 *     tags: [Customers]
 *     summary: Add a new customer
 */
router.get('/', customerController.getCustomers);
router.post('/', validate(customerValidators.createCustomer), customerController.createCustomer);

/**
 * @swagger
 * /restaurant/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get single customer
 *   put:
 *     tags: [Customers]
 *     summary: Update customer
 *   delete:
 *     tags: [Customers]
 *     summary: Delete customer
 */
router.get('/:id', customerController.getCustomer);
router.put('/:id', validate(customerValidators.updateCustomer), customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

/**
 * @swagger
 * /restaurant/customers/{id}/history:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer order history
 */
router.get('/:id/history', customerController.getCustomerHistory);

module.exports = router;
