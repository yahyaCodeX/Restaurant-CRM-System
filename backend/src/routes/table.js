const router = require('express').Router();
const tableController = require('../controllers/tableController');
const { protect, authorize, requireApproval } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('restaurant_owner'));
router.use(requireApproval);

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: Table management
 */

/**
 * @swagger
 * /restaurant/tables:
 *   get:
 *     tags: [Tables]
 *     summary: Get all tables
 *   post:
 *     tags: [Tables]
 *     summary: Add a new table
 */
router.get('/', tableController.getTables);
router.post('/', tableController.addTable);

/**
 * @swagger
 * /restaurant/tables/{id}:
 *   put:
 *     tags: [Tables]
 *     summary: Update table
 *   delete:
 *     tags: [Tables]
 *     summary: Remove table
 */
router.put('/:id', tableController.updateTable);
router.delete('/:id', tableController.removeTable);

/**
 * @swagger
 * /restaurant/tables/{id}/toggle:
 *   put:
 *     tags: [Tables]
 *     summary: Toggle table occupied status
 */
router.put('/:id/toggle', tableController.toggleStatus);

module.exports = router;
