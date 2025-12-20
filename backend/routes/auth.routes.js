const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// User Registration
router.post('/register/send-otp', authController.registerSendOtp);
router.post('/register/user', authController.registerUser);

// Admin Registration
router.post('/register/admin', authController.registerAdmin);

// Logins
router.post('/login', authController.loginUser);
router.post('/login/admin', authController.loginAdmin);

// Password Management
router.post('/forgot-password', authController.forgotPassword);
router.post('/admin/forgot-password', authController.adminForgotPassword);
router.post('/reset-password', authController.resetPassword);

// Debug
router.get('/debug/user/:email', authController.debugUser);

module.exports = router;
