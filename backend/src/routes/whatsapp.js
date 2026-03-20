const router = require('express').Router();
const whatsappController = require('../controllers/whatsappController');
const { protect, authorize, requireApproval } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: WhatsApp AI ordering webhook
 */

/**
 * @swagger
 * /whatsapp/webhook:
 *   get:
 *     tags: [WhatsApp]
 *     summary: Verify webhook (Meta requirement)
 *     security: []
 *   post:
 *     tags: [WhatsApp]
 *     summary: Receive incoming WhatsApp messages
 *     security: []
 */
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);

router.post(
  '/simulate',
  protect,
  authorize('restaurant_owner', 'admin'),
  requireApproval,
  whatsappController.simulateMessage
);

module.exports = router;
