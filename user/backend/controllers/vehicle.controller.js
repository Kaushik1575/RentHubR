const supabase = require('../config/supabase');
const SupabaseDB = require('../models/supabaseDB');

// Helper to check time conflict with 1-hour buffer
function checkConflictWithBuffer(existingBookings, startTime, duration) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = startTimeMinutes + (duration * 60);
    const bufferStartTime = startTimeMinutes - 60;
    const bufferEndTime = endTimeMinutes + 60;

    for (const booking of existingBookings) {
        if (!booking.start_time) continue;
        const [bHour, bMinute] = booking.start_time.split(':').map(Number);
        const bStartMinutes = bHour * 60 + bMinute;
        const bEndMinutes = bStartMinutes + (booking.duration * 60);

        if (bStartMinutes < bufferEndTime && bEndMinutes > bufferStartTime) {
            const endH = Math.floor(bEndMinutes / 60) % 24;
            const endM = bEndMinutes % 60;
            const formattedEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
            return {
                conflict: true,
                existingBooking: booking,
                message: `Booked from ${booking.start_time} to ${formattedEndTime} (requires 1-hr gap)`
            };
        }
    }
    return { conflict: false };
}

const getVehiclesByType = async (req, res) => {
    const { type } = req.params;
    try {
        const vehicles = await SupabaseDB.getVehicles(type);
        res.json(vehicles);
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        res.status(500).json({ error: `Error fetching ${type}` });
    }
};

const getVehicleById = async (req, res) => {
    try {
        let { type, id } = req.params;
        console.log('Requested type:', type, 'Requested id:', id);
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        console.log('Mapped type:', type, 'ID:', id);
        const vehicle = await SupabaseDB.getVehicleById(type, id);
        console.log('Vehicle result:', vehicle);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (error) {
        console.error(`Error fetching vehicle:`, error);
        res.status(500).json({ error: 'Error fetching vehicle' });
    }
};

/**
 * Check Fleet Availability across all categories or a specific category for a given date, time, and duration.
 */
const checkFleetAvailability = async (req, res) => {
    try {
        const { startDate, startTime, duration = 2, vehicleType = 'all' } = req.body;

        if (!startDate || !startTime) {
            return res.status(400).json({ error: 'startDate and startTime are required.' });
        }

        // Validate time format (HH:mm)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            return res.status(400).json({ error: 'Invalid time format. Please use HH:mm (24-hour).' });
        }

        const [hours, minutes] = startTime.split(':').map(Number);
        const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const parsedDuration = Math.max(1, parseInt(duration) || 2);

        // Validate that booking is not in the past (IST timezone)
        const now = new Date();
        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const currentIso = istNow.toISOString().slice(0, 16);
        const requestedIso = `${startDate}T${formattedStartTime}`;

        if (requestedIso < currentIso) {
            return res.status(400).json({ error: 'Cannot check availability for a past date or time.' });
        }

        // Determine which vehicle tables to query
        const normalizedType = (vehicleType || 'all').toLowerCase();
        let tablesToFetch = [];
        if (normalizedType === 'all') {
            tablesToFetch = ['bikes', 'scooty', 'cars'];
        } else if (normalizedType === 'bike' || normalizedType === 'bikes') {
            tablesToFetch = ['bikes'];
        } else if (normalizedType === 'scooty' || normalizedType === 'scooter' || normalizedType === 'scooters') {
            tablesToFetch = ['scooty'];
        } else if (normalizedType === 'car' || normalizedType === 'cars') {
            tablesToFetch = ['cars'];
        } else {
            tablesToFetch = ['bikes', 'scooty', 'cars'];
        }

        // Fetch vehicles from all requested tables
        const vehiclePromises = tablesToFetch.map(async (table) => {
            const data = await SupabaseDB.getVehicles(table);
            const singleType = table === 'bikes' ? 'bike' : table === 'cars' ? 'car' : 'scooty';
            return (data || []).map(v => ({ ...v, category: singleType, tableType: table }));
        });

        const vehicleArrays = await Promise.all(vehiclePromises);
        const allVehicles = vehicleArrays.flat();

        // Fetch all active bookings on the given date
        const { data: dateBookings, error: bookingErr } = await supabase
            .from('bookings')
            .select('*')
            .eq('start_date', startDate)
            .neq('status', 'cancelled')
            .neq('status', 'rejected');

        if (bookingErr) {
            console.error('Error querying bookings for fleet availability:', bookingErr);
            throw bookingErr;
        }

        // Group bookings by vehicle_id
        const bookingsByVehicle = {};
        (dateBookings || []).forEach(b => {
            if (!bookingsByVehicle[b.vehicle_id]) {
                bookingsByVehicle[b.vehicle_id] = [];
            }
            bookingsByVehicle[b.vehicle_id].push(b);
        });

        // Evaluate availability for each vehicle
        const results = allVehicles.map(vehicle => {
            const vehicleBookings = bookingsByVehicle[vehicle.id] || [];
            
            // Check manual availability flag in DB first
            if (vehicle.is_available === false) {
                return {
                    id: vehicle.id,
                    name: vehicle.name,
                    category: vehicle.category,
                    pricePerHour: vehicle.price,
                    estimatedTotal: (parseFloat(vehicle.price) || 0) * parsedDuration,
                    isAvailable: false,
                    reason: 'Currently undergoing maintenance'
                };
            }

            const conflictCheck = checkConflictWithBuffer(vehicleBookings, formattedStartTime, parsedDuration);

            return {
                id: vehicle.id,
                name: vehicle.name,
                category: vehicle.category,
                pricePerHour: vehicle.price,
                estimatedTotal: (parseFloat(vehicle.price) || 0) * parsedDuration,
                isAvailable: !conflictCheck.conflict,
                reason: conflictCheck.conflict ? conflictCheck.message : null,
                existingBookingsCount: vehicleBookings.length
            };
        });

        const availableList = results.filter(r => r.isAvailable);
        const unavailableList = results.filter(r => !r.isAvailable);

        res.json({
            success: true,
            query: {
                startDate,
                startTime: formattedStartTime,
                duration: parsedDuration,
                vehicleType: normalizedType
            },
            summary: {
                totalCount: results.length,
                availableCount: availableList.length,
                unavailableCount: unavailableList.length
            },
            availableVehicleIds: availableList.map(v => v.id),
            results
        });

    } catch (error) {
        console.error('Error in checkFleetAvailability:', error);
        res.status(500).json({ error: 'Failed to check fleet availability.' });
    }
};

/**
 * Get daily schedule & booked slots for a specific vehicle on a given date.
 */
const getVehicleSchedule = async (req, res) => {
    try {
        let { type, id } = req.params;
        const { date } = req.query;

        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';

        const targetDate = date || new Date().toISOString().split('T')[0];

        const vehicle = await SupabaseDB.getVehicleById(type, id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // Fetch bookings for this vehicle on targetDate
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('id, booking_id, start_date, start_time, duration, status')
            .eq('vehicle_id', id)
            .eq('start_date', targetDate)
            .neq('status', 'cancelled')
            .neq('status', 'rejected');

        if (error) {
            console.error('Error fetching schedule:', error);
            throw error;
        }

        const bookedSlots = (bookings || []).map(b => {
            if (!b.start_time) return null;
            const [bHour, bMinute] = b.start_time.split(':').map(Number);
            const startMinutes = bHour * 60 + bMinute;
            const endMinutes = startMinutes + ((b.duration || 1) * 60);

            const endH = Math.floor(endMinutes / 60) % 24;
            const endM = endMinutes % 60;

            const bufferStartMin = Math.max(0, startMinutes - 60);
            const bufferEndMin = endMinutes + 60;

            return {
                id: b.id,
                bookingId: b.booking_id,
                startTime: b.start_time,
                endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
                duration: b.duration,
                status: b.status,
                bufferStartTime: `${Math.floor(bufferStartMin / 60).toString().padStart(2, '0')}:${(bufferStartMin % 60).toString().padStart(2, '0')}`,
                bufferEndTime: `${(Math.floor(bufferEndMin / 60) % 24).toString().padStart(2, '0')}:${(bufferEndMin % 60).toString().padStart(2, '0')}`
            };
        }).filter(Boolean);

        res.json({
            success: true,
            vehicle: {
                id: vehicle.id,
                name: vehicle.name,
                price: vehicle.price,
                is_available: vehicle.is_available
            },
            date: targetDate,
            bookedSlots,
            isFullyAvailable: bookedSlots.length === 0 && vehicle.is_available !== false
        });

    } catch (error) {
        console.error('Error fetching vehicle schedule:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle schedule.' });
    }
};

module.exports = {
    getVehiclesByType,
    getVehicleById,
    checkFleetAvailability,
    getVehicleSchedule
};
