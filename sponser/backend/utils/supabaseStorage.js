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
        const originalExt = path.extname(file.originalname || '') || '.jpg';
        const uniqueName = `${folder ? folder + '/' : ''}${file.fieldname || 'file'}-${timestamp}-${randomness}${originalExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(uniqueName, file.buffer, {
                contentType: file.mimetype || 'image/jpeg',
                upsert: true
            });

        if (error) {
            console.warn(`Supabase Storage Upload Warning (${bucket}/${uniqueName}):`, error.message || error);
            // Safe fallback: Convert file buffer to base64 Data URL so application flow is never disrupted
            if (file.buffer) {
                const b64 = file.buffer.toString('base64');
                const mime = file.mimetype || 'image/jpeg';
                return `data:${mime};base64,${b64}`;
            }
            return null;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(uniqueName);

        if (publicUrlData && publicUrlData.publicUrl) {
            return publicUrlData.publicUrl;
        }

        if (file.buffer) {
            const b64 = file.buffer.toString('base64');
            const mime = file.mimetype || 'image/jpeg';
            return `data:${mime};base64,${b64}`;
        }

        return null;
    } catch (error) {
        console.warn('Supabase storage fallback activated:', error.message || error);
        if (file.buffer) {
            const b64 = file.buffer.toString('base64');
            const mime = file.mimetype || 'image/jpeg';
            return `data:${mime};base64,${b64}`;
        }
        return null;
    }
};

module.exports = { uploadToSupabase };
