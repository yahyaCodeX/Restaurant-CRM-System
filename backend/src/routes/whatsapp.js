const router = require('express').Router();
const whatsappController = require('../controllers/whatsappController');

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

module.exports = router;
