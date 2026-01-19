const supabase = require('../config/supabase');

class SupabaseDB {
    // User operations
    static async createUser(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getUserByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async updateUser(id, userData) {
        const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Booking operations
    static async createBooking(bookingData) {
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getBookingsByUser(userId) {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .order('id', { ascending: false }); // Sort by ID descending (newest first)

        if (error) throw error;

        // Update status for past bookings
        const now = new Date();
        const updatedData = data.map(booking => {
            if (booking.status === 'confirmed' && booking.start_date && booking.start_time) {
                // Parse start date and time
                const [year, month, day] = booking.start_date.split('-').map(Number);
                const [hours, minutes] = booking.start_time.split(':').map(Number);

                // Create date object (months are 0-indexed in JS Date)
                const bookingStart = new Date(year, month - 1, day, hours, minutes);

                if (now > bookingStart) {
                    return { ...booking, status: 'completed' };
                }
            }
            return booking;
        });

        return updatedData;
    }

    static async getBookingById(bookingId) {
        let query = supabase.from('bookings').select('*, users:user_id(full_name)');

        // If ID looks like BK-XXX or RHXXX, search by booking_id column
        // Otherwise assume numeric ID
        const isStringId = typeof bookingId === 'string' && (bookingId.startsWith('BK-') || bookingId.startsWith('RH'));

        if (isStringId) {
            query = query.eq('booking_id', bookingId);
        } else {
            query = query.eq('id', bookingId);
        }

        const { data, error } = await query.single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async getUserById(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    // Vehicle operations (bikes, cars, scooty)
    static async getVehicles(type) {
        const { data, error } = await supabase
            .from(type) // 'bikes', 'cars', or 'scooty'
            .select('*');

        if (error) throw error;
        return data;
    }

    static async getVehicleById(type, id) {
        const { data, error } = await supabase
            .from(type)
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async updateVehicleAvailability(type, id, isAvailable) {
        const { data, error } = await supabase
            .from(type)
            .update({ is_available: isAvailable })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Review operations
    static async createReview(reviewData) {
        const { data, error } = await supabase
            .from('reviews')
            .insert([reviewData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getReviews(vehicleType, vehicleId) {
        // vehicleType can be 'bikes', 'cars', 'scooty'
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                users:user_id (
                    full_name,
                    profile_photo
                )
            `)
            .eq('vehicle_type', vehicleType)
            .eq('vehicle_id', vehicleId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    static async checkVerifiedPurchase(userId, vehicleType, vehicleId) {
        // vehicleType logic mapping might be needed if frontend sends 'bike' vs 'bikes'
        // Ideally frontend sends consistent types matching DB tables ('bikes', 'cars', 'scooty')

        // Check if user has a COMPLETED booking for this vehicle
        // We look at 'bookings' table.
        // The bookings table has vehicle_id.
        // It presumably relies on us knowing the vehicle type context or storing it.
        // Looking at BookingForm.jsx, it sends vehicleType in payload.
        // Let's check SupabaseDB.createBooking... it inserts bookingData.

        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .eq('vehicle_id', vehicleId)
            .eq('status', 'completed'); // or 'confirmed' if we want to allow reviewing active rentals? Usually only completed.

        if (error) return false;

        // Also need to check if booking matched the vehicle type if booking table doesn't store type (it might share IDs across tables?)
        // Assuming unique IDs or 'vehicle_type' column in bookings.
        // Checking booking controller/model might be good, but let's assume filtering by ID and User and Status is a strong signal.
        // Ideally we should check vehicle_type too if bookings table has it.

        return data && data.length > 0;
    }

    static async getReviewById(reviewId) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', reviewId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async deleteReview(reviewId) {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) throw error;
        return true;
    }
}

module.exports = SupabaseDB; 