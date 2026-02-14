import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Folder path in Cloudinary
 * @returns {Promise<{fileUrl: string, publicId: string}>}
 */
export const uploadToCloudinary = async (fileBuffer, fileName, folder = 'manifestos') => {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `iitk-election/${folder}`,
                    resource_type: 'raw', // Store PDF as-is, proxy handles inline viewing
                    public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '')}`,
                    format: 'pdf'
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(new Error('Failed to upload file to Cloudinary'));
                    } else {
                        resolve({
                            fileUrl: result.secure_url,
                            publicId: result.public_id,
                            fileName: fileName
                        });
                    }
                }
            );

            // Convert buffer to stream and pipe to Cloudinary
            const bufferStream = Readable.from(fileBuffer);
            bufferStream.pipe(uploadStream);
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to Cloudinary');
    }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file in Cloudinary
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        console.log(`✅ Deleted file: ${publicId}`);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        // Don't throw error if file doesn't exist
        if (error.http_code !== 404) {
            throw new Error('Failed to delete file from Cloudinary');
        }
    }
};

/**
 * Get file URL (already public in Cloudinary)
 * @param {string} publicId - Public ID of the file
 */
export const getFileUrl = (publicId) => {
    return cloudinary.url(publicId, { resource_type: 'raw' });
};
