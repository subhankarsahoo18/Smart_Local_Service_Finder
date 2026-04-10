const express = require('express');
const router = express.Router();
const { handleIncomingWhatsApp } = require('../controllers/whatsappController');

// Twilio webhook endpoint receives form POST requests
router.post('/webhook', handleIncomingWhatsApp);

module.exports = router;
