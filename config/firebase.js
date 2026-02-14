import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let bucket;

export const initializeFirebase = () => {
    try {
        const serviceAccount = JSON.parse(
            readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
        );

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });

        bucket = admin.storage().bucket();
        console.log('✅ Firebase Storage initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        console.log('⚠️  Make sure to:');
        console.log('   1. Download Firebase service account JSON');
        console.log('   2. Place it in backend folder');
        console.log('   3. Update FIREBASE_SERVICE_ACCOUNT_PATH in .env');
    }
};

export const getStorageBucket = () => {
    if (!bucket) {
        throw new Error('Firebase Storage not initialized');
    }
    return bucket;
};

export default admin;
