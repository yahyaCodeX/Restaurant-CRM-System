const whatsappService = require('../services/whatsappService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');
const twilio = require('twilio');
const config = require('../config');

// Twilio webhook token validator (middleware-like)
const validateTwilioWebhook = (req, res) => {
  const params = req.body;
  const twilioSignature = req.headers['x-twilio-signature'];
  const url = config.whatsapp.webhookUrl || `${config.frontendUrl.replace('5173', '5000')}/api/v1/whatsapp/webhook`;

  // Validate webhook came from Twilio (optional but recommended)
  // const validator = twilio.webhook(config.whatsapp.authToken, twilioSignature, url, params);
  // if (!validator) {
  //   logger.warn('Invalid Twilio signature');
  //   return false;
  // }
  return true;
};

exports.verifyWebhook = (req, res) => {
  // Twilio doesn't require verification for status callbacks
  logger.info('WhatsApp webhook verified');
  res.status(200).send('OK');
};

exports.handleWebhook = catchAsync(async (req, res) => {
  // Validate Twilio signature (optional but recommended)
  // if (!validateTwilioWebhook(req, res)) {
  //   return res.status(403).json({ success: false, message: 'Invalid signature' });
  // }

  // Always respond 200 to Twilio immediately
  const twiml = new twilio.twiml.MessagingResponse();
  res.type('text/xml');
  res.send(twiml.toString());

  // Process message asynchronously
  await whatsappService.processMessage(req.body);
});

exports.simulateMessage = catchAsync(async (req, res) => {
  const message = req.body?.message?.trim();
  const sessionId = (req.body?.sessionId || 'default').toString().slice(0, 64);

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'message is required',
    });
  }

  const from = `sim:${req.user._id}:${sessionId}`;
  const data = await whatsappService.simulateMessage({ from, text: message });

  return ApiResponse.success(res, data, 'Simulated message processed');
});
