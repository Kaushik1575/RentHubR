const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// 30% Advance payment order creation
router.post('/create-order', verifyToken, paymentController.createOrder);

// Fixed-amount Dynamic UPI QR code generation/fetch for ride settlement
router.post('/settlement-qr', paymentController.getSettlementQR);

// Polling settlement status for a booking
router.get('/settlement-status/:bookingId', paymentController.getSettlementStatus);

// Backend payment verification via Razorpay
router.post('/verify-settlement', paymentController.verifySettlement);

// Signed Razorpay Webhook receiver
router.post('/razorpay-webhook', paymentController.handleRazorpayWebhook);

module.exports = router;
