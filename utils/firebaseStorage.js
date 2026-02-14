import { getStorageBucket } from '../config/firebase.js';
import path from 'path';

/**
 * Upload file to Firebase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Folder path in storage
 * @returns {Promise<{fileUrl: string, firebasePath: string}>}
 */
export const uploadToFirebase = async (fileBuffer, fileName, folder = 'manifestos') => {
    try {
        const bucket = getStorageBucket();

        // Create unique file name
        const timestamp = Date.now();
        const ext = path.extname(fileName);
        const baseName = path.basename(fileName, ext);
        const uniqueFileName = `${baseName}_${timestamp}${ext}`;
        const firebasePath = `${folder}/${uniqueFileName}`;

        // Create file reference
        const file = bucket.file(firebasePath);

        // Upload file
        await file.save(fileBuffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    originalName: fileName,
                    uploadedAt: new Date().toISOString()
                }
            }
        });

        // Make file publicly accessible (optional - can be changed for private access)
        await file.makePublic();

        // Get public URL
        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${firebasePath}`;

        return {
            fileUrl,
            firebasePath,
            fileName: uniqueFileName
        };
    } catch (error) {
        console.error('Firebase upload error:', error);
        throw new Error('Failed to upload file to Firebase Storage');
    }
};

/**
 * Delete file from Firebase Storage
 * @param {string} firebasePath - Path to file in Firebase Storage
 */
export const deleteFromFirebase = async (firebasePath) => {
    try {
        const bucket = getStorageBucket();
        const file = bucket.file(firebasePath);

        await file.delete();
        console.log(`✅ Deleted file: ${firebasePath}`);
    } catch (error) {
        console.error('Firebase delete error:', error);
        // Don't throw error if file doesn't exist
        if (error.code !== 404) {
            throw new Error('Failed to delete file from Firebase Storage');
        }
    }
};

/**
 * Get signed URL for private file access
 * @param {string} firebasePath - Path to file in Firebase Storage
 * @param {number} expiresIn - Expiration time in minutes (default: 60)
 */
export const getSignedUrl = async (firebasePath, expiresIn = 60) => {
    try {
        const bucket = getStorageBucket();
        const file = bucket.file(firebasePath);

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + expiresIn * 60 * 1000
        });

        return url;
    } catch (error) {
        console.error('Firebase signed URL error:', error);
        throw new Error('Failed to generate signed URL');
    }
};
