const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

router.post('/chat', chatbotController.chat);
router.post('/weather', chatbotController.checkWeather);

module.exports = router;
