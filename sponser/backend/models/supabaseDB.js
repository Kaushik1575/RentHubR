const supabase = require('../config/supabase');

class SupabaseDB {

    // ============================================
    // SEPARATE SPONSOR AUTHENTICATION METHODS
    // ============================================

    /**
     * Create a new sponsor account (independent from users table)
     */
    static async createSponsorAccount(sponsorData) {
        const { data, error } = await supabase
            .from('sponsors')
            .insert([sponsorData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get sponsor by email
     */
    static async getSponsorByEmail(email) {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    /**
     * Get sponsor by ID
     */
    static async getSponsorById(id) {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    /**
     * Update sponsor details
     */
    static async updateSponsor(id, updateData) {
        const { data, error } = await supabase
            .from('sponsors')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get all bikes for a specific sponsor
     */
    static async getSponsorBikes(sponsorId) {
        const { data, error } = await supabase
            .from('bikes')
            .select('*')
            .eq('sponsor_id', sponsorId);

        if (error) throw error;
        return data;
    }

    /**
     * Add bike for a sponsor
     */
    static async addBike(vehicleData) {
        const { data, error } = await supabase
            .from('bikes')
            .insert([vehicleData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

module.exports = SupabaseDB;
