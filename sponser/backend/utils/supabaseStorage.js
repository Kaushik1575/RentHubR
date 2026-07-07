const supabase = require('../config/supabase');
const path = require('path');

/**
 * Uploads a file to Supabase Storage
 * @param {Object} file - The file object from multer (req.file)
 * @param {string} bucket - The Supabase Storage bucket name (default: 'uploads')
 * @param {string} folder - Optional folder prefix inside the bucket
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadToSupabase = async (file, bucket = 'uploads', folder = '') => {
    if (!file) return null;

    try {
        // Create unique filename
        const timestamp = Date.now();
        const randomness = Math.floor(Math.random() * 1000);
        const originalExt = path.extname(file.originalname);
        const uniqueName = `${folder ? folder + '/' : ''}${file.fieldname}-${timestamp}-${randomness}${originalExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(uniqueName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error(`Supabase Storage Upload Error (${bucket}/${uniqueName}):`, error);
            throw new Error('Failed to upload file to storage');
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(uniqueName);

        if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error('Failed to get public URL for uploaded file');
        }

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Core upload error:', error);
        throw error;
    }
};

module.exports = { uploadToSupabase };
