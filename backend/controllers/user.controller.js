const SupabaseDB = require('../models/supabaseDB');

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await SupabaseDB.getUserById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove sensitive data if any (though password isn't usually stored in this table if using external auth, but we might have password_hash)
        // Adjust based on your schema. Assuming 'password' field exists.
        const { password, ...userProfile } = user;

        res.json({ success: true, user: userProfile });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone_number, address, profile_photo, aadhaar_number } = req.body;

        const updateData = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (address !== undefined) updateData.address = address;
        if (profile_photo !== undefined) updateData.profile_photo = profile_photo;
        // Optionally allow aadhaar update if not verified? For now, allow it.
        if (aadhaar_number !== undefined) updateData.aadhaar_number = aadhaar_number;

        const updatedUser = await SupabaseDB.updateUser(userId, updateData);

        const { password, ...userProfile } = updatedUser;

        res.json({ success: true, user: userProfile, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
};
