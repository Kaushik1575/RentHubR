const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { generateInvoiceBuffer } = require('../utils/invoiceGenerator');
const SupabaseDB = require('../models/supabaseDB');

/**
 * GET /api/bookings/:bookingId/invoice
 * Download invoice PDF for a specific booking
 */
router.get('/:bookingId/invoice', verifyToken, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        // Fetch booking details
        const booking = await SupabaseDB.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Verify user owns this booking (or is admin)
        if (booking.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to access this invoice' });
        }

        // Fetch user details
        const user = await SupabaseDB.getUserById(booking.user_id);

        // Generate invoice PDF
        const pdfBuffer = await generateInvoiceBuffer(
            booking.id,
            user.full_name,
            user.email,
            booking.vehicle_name || `${booking.vehicle_type} #${booking.vehicle_id}`,
            booking.duration,
            `${booking.start_date} ${booking.start_time}`,
            booking.total_amount,
            booking.advance_payment
        );

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${bookingId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({
            error: 'Failed to generate invoice',
            details: error.message
        });
    }
});

module.exports = router;
