import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to Firebase)
const storage = multer.memoryStorage();

// File filter - only allow PDFs
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.pdf') {
        return cb(new Error('Only PDF files are allowed'), false);
    }

    // Check mimetype
    if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Invalid file type. Only PDF files are allowed'), false);
    }

    cb(null, true);
};

// Create multer upload instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    }
});

// Error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next();
};
