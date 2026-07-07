const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const sponsorController = require('../controllers/sponsor.controller');
const withdrawalController = require('../controllers/withdrawal.controller');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Create multiple file upload middleware
const uploadFiles = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'rc', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
    { name: 'puc', maxCount: 1 }
]);

// Auth Routes (no /sponsor prefix for these)
router.post('/send-email-otp', authController.sendEmailOtp);
router.post('/send-mobile-otp', authController.sendMobileOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/register', authController.registerSponsor);
router.post('/login', authController.loginSponsor);

// Sponsor Routes (with /sponsor prefix)
router.get('/sponsor/profile', verifyToken, sponsorController.getProfile);
router.put('/sponsor/profile', verifyToken, sponsorController.updateProfile);
router.post('/sponsor/profile-picture', verifyToken, upload.single('profilePicture'), sponsorController.uploadProfilePicture);
router.put('/sponsor/update-bank-details', verifyToken, authController.updateBankDetails);
router.get('/sponsor/dashboard', verifyToken, sponsorController.getDashboard);
router.post('/sponsor/add-bike', verifyToken, uploadFiles, sponsorController.addBike);
router.get('/sponsor/my-bikes', verifyToken, sponsorController.getMyBikes);
router.patch('/sponsor/bikes/:id/availability', verifyToken, sponsorController.toggleAvailability);
router.patch('/sponsor/bikes/:id', verifyToken, sponsorController.updateVehicle);
router.delete('/sponsor/bikes/:id', verifyToken, sponsorController.deleteVehicle);
router.get('/sponsor/revenue', verifyToken, sponsorController.getRevenue);
router.get('/sponsor/bookings', verifyToken, sponsorController.getBookings);
router.post('/sponsor/check-date-availability', verifyToken, sponsorController.checkDateAvailability);

// Withdrawal Routes (Sponsor)
router.post('/sponsor/withdrawal/request', verifyToken, withdrawalController.createWithdrawalRequest);
router.get('/sponsor/withdrawal/my-requests', verifyToken, withdrawalController.getMyWithdrawalRequests);
router.put('/sponsor/bank-details', verifyToken, withdrawalController.updateBankDetails);

// Withdrawal Routes (Admin)
router.get('/admin/withdrawal/test', (req, res) => {
    res.json({ message: 'Withdrawal routes are working!' });
});
router.get('/admin/withdrawal/requests', withdrawalController.getAllWithdrawalRequests);
router.patch('/admin/withdrawal/requests/:requestId', withdrawalController.updateWithdrawalStatus);

// Fleet Management (Admin Setup)
router.get('/admin/fleet', sponsorController.getFleetData);
router.post('/admin/assign-fleet', sponsorController.assignFleet);
router.get('/admin/sponsor-report', sponsorController.getSponsorEarningsReport);

module.exports = router;
