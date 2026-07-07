const multer = require('multer');

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter (optional but good practice)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB (increased from 5MB)
    fileFilter: fileFilter
});

module.exports = upload;
