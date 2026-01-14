const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyAdminToken } = require('../middleware/authMiddleware');

// Bookings
router.get('/bookings', verifyAdminToken, adminController.getAllBookings);
router.get('/bookings/:id', verifyAdminToken, adminController.getBookingById);
router.delete('/bookings/:id', verifyAdminToken, adminController.deleteBooking);
router.put('/bookings/:id', verifyAdminToken, adminController.updateBooking);

// Booking actions
router.post('/bookings/:id/confirm', verifyAdminToken, adminController.confirmBooking);

router.post('/bookings/:id/cancel', verifyAdminToken, adminController.cancelBookingAdmin);
router.post('/bookings/:id/refund-complete', verifyAdminToken, adminController.markRefundComplete);
router.post('/scan-qr', verifyAdminToken, adminController.handleQRScan);

// SOS
router.post('/send-sos', verifyAdminToken, adminController.sendSOS);

// Users
router.get('/users', verifyAdminToken, adminController.getAllUsers);
router.get('/users/:id', verifyAdminToken, adminController.getUserById);
router.put('/users/:id', verifyAdminToken, adminController.updateUser);
router.patch('/users/:id/block', verifyAdminToken, adminController.blockUser);

// Vehicles
router.get('/vehicles', verifyAdminToken, adminController.getAllVehicles);
router.post('/vehicles/:type', verifyAdminToken, adminController.addVehicle);
router.get('/vehicles/:type/:id', verifyAdminToken, adminController.getVehicleById);
router.put('/vehicles/:type/:id', verifyAdminToken, adminController.updateVehicle);
router.delete('/vehicles/:type/:id', verifyAdminToken, adminController.deleteVehicle);

// Policies
router.get('/policies', verifyAdminToken, adminController.getPolicies);

// Reminders (Cron & Manual)
// Schedule manual reminder check
router.post('/cron/reminders/manual', verifyAdminToken, adminController.manualReminderCheck);
router.get('/cron/reminders', adminController.cronReminderCheck); // No token, uses query secret

module.exports = router;
