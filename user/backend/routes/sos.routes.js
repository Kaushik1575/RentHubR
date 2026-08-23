const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sos.controller');

router.post('/sos-activate', sosController.activateSOS);
router.post('/sos-feedback', sosController.handleSOSFeedback);
router.post('/sos-send-nearby', sosController.sendNearestLocations);
router.post('/sos/send-nearby-locations', sosController.sendNearestLocations);

module.exports = router;

