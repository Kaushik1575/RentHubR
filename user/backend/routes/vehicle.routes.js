const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');

// Check fleet availability across categories
router.post('/check-fleet-availability', vehicleController.checkFleetAvailability);

// Get schedule & booked slots for a specific vehicle on a date
router.get('/:type/:id/schedule', vehicleController.getVehicleSchedule);

// Standard vehicle fetch routes
router.get('/:type', vehicleController.getVehiclesByType);
router.get('/:type/:id', vehicleController.getVehicleById);

module.exports = router;
