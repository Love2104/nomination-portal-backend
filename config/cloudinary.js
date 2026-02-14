import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test connection
try {
    cloudinary.api.ping()
        .then(() => console.log('✅ Cloudinary connected successfully'))
        .catch(() => console.log('⚠️  Cloudinary configuration incomplete - add credentials to .env'));
} catch (error) {
    console.log('⚠️  Cloudinary not configured yet');
}

export default cloudinary;
