const whatsappService = require('../services/whatsappService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = whatsappService.verifyWebhook(mode, token, challenge);

  if (result) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(result);
  }

  res.status(403).json({ success: false, message: 'Verification failed' });
};

exports.handleWebhook = catchAsync(async (req, res) => {
  // Always respond 200 to Meta immediately
  res.status(200).json({ success: true });

  // Process message asynchronously
  await whatsappService.processMessage(req.body);
});
