// Retell AI Outbound Call Service
// This service handles automatic outbound calls when bookings are confirmed

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let fetch;
try {
    // Try to use node-fetch if available (v2 uses default export)
    fetch = require('node-fetch');
} catch (error) {
    // Fallback to global fetch (Node.js 18+)
    if (typeof globalThis.fetch !== 'undefined') {
        fetch = globalThis.fetch;
    } else {
        throw new Error('node-fetch is required. Please install it with: npm install node-fetch');
    }
}

// Retell AI Configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY || 'key_47254fd3407901e9678eb9f05504';
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_1bafe9ca9c302f33c15826c22b';
const RETELL_SOS_AGENT_ID = process.env.RETELL_SOS_AGENT_ID || 'agent_3df3da5cd8eb882f4a2906d499';
const RETELL_FROM_NUMBER = process.env.RETELL_FROM_NUMBER || '+13502072319';
const RETELL_API_URL = 'https://api.retellai.com/v2/create-phone-call';

/**
 * Format phone number to E.164 format (e.g., +918018084672)
 */
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
        return null;
    }

    let cleaned = String(phoneNumber).trim();

    const hasPlus = cleaned.startsWith('+');
    if (hasPlus) {
        cleaned = cleaned.substring(1);
    }

    cleaned = cleaned.replace(/\D/g, '');

    if (!cleaned || cleaned.length === 0) {
        return null;
    }

    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    } else if (cleaned.length === 9) {
        cleaned = '91' + cleaned;
    }

    return '+' + cleaned;
}

/**
 * Make an outbound call using Retell AI
 */
async function makeOutboundCall(toNumber, callMetadata = {}) {
    try {
        const formattedToNumber = formatPhoneNumber(toNumber);

        if (!formattedToNumber) {
            return {
                success: false,
                error: 'Invalid phone number provided'
            };
        }

        const targetAgentId = callMetadata.agent_id || (callMetadata.call_reason === 'sos_emergency' ? RETELL_SOS_AGENT_ID : RETELL_AGENT_ID);
        const payload = {
            from_number: RETELL_FROM_NUMBER,
            to_number: formattedToNumber,
            call_type: 'phone_call',
            override_agent_id: targetAgentId
        };

        if (Object.keys(callMetadata).length > 0) {
            payload.metadata = callMetadata;
            payload.retell_llm_dynamic_variables = {
                booking_id: String(callMetadata.booking_id || callMetadata.bookingId || ''),
                vehicle_name: String(callMetadata.vehicle_name || callMetadata.vehicleName || ''),
                vehicle_type: String(callMetadata.vehicle_type || callMetadata.vehicleType || ''),
                start_date: String(callMetadata.start_date || callMetadata.startDate || ''),
                start_time: String(callMetadata.start_time || callMetadata.startTime || ''),
                duration: String(callMetadata.duration || ''),
                user_name: String(callMetadata.user_name || callMetadata.userName || ''),
                user_email: String(callMetadata.user_email || callMetadata.userEmail || ''),
                total_amount: String(callMetadata.total_amount || callMetadata.totalAmount || ''),
                advance_payment: String(callMetadata.advance_payment || callMetadata.advancePayment || ''),
                remaining_amount: String(callMetadata.remaining_amount || callMetadata.remainingAmount || ''),
                call_reason: String(callMetadata.call_reason || 'booking_confirmation'),
                gps_location: String(callMetadata.gps_location || callMetadata.gpsLocation || 'Live GPS Active'),
                pickup_location: String(callMetadata.pickup_location || callMetadata.pickupLocation || 'GITA Autonomous College BBSR'),
                emergency_phone: String(callMetadata.emergency_phone || '9040757683')
            };
        }

        console.log('Making Retell AI outbound call:', {
            to: formattedToNumber,
            from: RETELL_FROM_NUMBER,
            agent: targetAgentId
        });

        const response = await fetch(RETELL_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('📞 Retell AI outbound call launched successfully!');
            console.log('Call ID:', data.call_id || data.id);
            return {
                success: true,
                callId: data.call_id || data.id,
                data: data
            };
        } else {
            console.error('❌ Retell AI API Error:', data);
            return {
                success: false,
                error: data.error || data.message || 'Unknown API error',
                details: data
            };
        }
    } catch (error) {
        console.error('⚠️ Retell AI Request Failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Make an outbound call for booking confirmation
 */
async function makeBookingConfirmationCall(userPhoneNumber, bookingDetails = {}) {
    try {
        if (!userPhoneNumber) {
            return {
                success: false,
                error: 'User phone number is required'
            };
        }

        const callMetadata = {
            call_reason: 'booking_confirmation',
            booking_id: bookingDetails.bookingId || null,
            vehicle_name: bookingDetails.vehicleName || null,
            vehicle_type: bookingDetails.vehicleType || null,
            start_date: bookingDetails.startDate || null,
            start_time: bookingDetails.startTime || null,
            duration: bookingDetails.duration || null,
            user_name: bookingDetails.userName || null,
            user_email: bookingDetails.userEmail || null
        };

        const result = await makeOutboundCall(userPhoneNumber, callMetadata);
        return result;
    } catch (error) {
        console.error('Error in makeBookingConfirmationCall:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Make an emergency outbound call for SOS troubleshooting & assistance
 */
async function makeSOSOutboundCall(userPhoneNumber, sosDetails = {}) {
    try {
        if (!userPhoneNumber) {
            return {
                success: false,
                error: 'User phone number is required for SOS call'
            };
        }

        const callMetadata = {
            call_reason: 'sos_emergency',
            booking_id: sosDetails.bookingId || null,
            vehicle_name: sosDetails.bikeModel || sosDetails.vehicleName || 'Vehicle',
            user_name: sosDetails.userName || 'Customer',
            user_email: sosDetails.userEmail || null,
            gps_location: sosDetails.gpsLocation || 'Location Provided',
            pickup_location: sosDetails.pickupLocation || 'GITA Autonomous College BBSR',
            emergency_phone: '9040757683'
        };

        console.log(`🚨 Triggering Retell AI Emergency SOS Call to ${userPhoneNumber}...`);
        const result = await makeOutboundCall(userPhoneNumber, callMetadata);
        return result;
    } catch (error) {
        console.error('Error in makeSOSOutboundCall:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    makeOutboundCall,
    makeBookingConfirmationCall,
    makeSOSOutboundCall,
    formatPhoneNumber
};
