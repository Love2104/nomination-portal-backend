import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let bucket;
let initialized = false;

// Auto-initialize on import
const initializeFirebase = () => {
    if (initialized) return;

    try {
        let credential;

        // Option 1: Service account JSON file path (local dev)
        if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
            const serviceAccount = JSON.parse(
                readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
            );
            credential = admin.credential.cert(serviceAccount);
            console.log('🔥 Firebase Admin: using service account file');
        }
        // Option 2: Service account JSON as env var (Render / production)
        else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            credential = admin.credential.cert(serviceAccount);
            console.log('🔥 Firebase Admin: using service account from env');
        }
        // Option 3: No credentials — won't be able to verify tokens
        else {
            console.warn('⚠️  Firebase Admin: No service account credentials found.');
            console.warn('   Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON');
            console.warn('   Token verification will NOT work without credentials.');
            return;
        }

        admin.initializeApp({
            credential,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'nomination-portal-iitk.firebasestorage.app'
        });

        bucket = admin.storage().bucket();
        initialized = true;
        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
    }
};

// Initialize immediately
initializeFirebase();

export const getStorageBucket = () => {
    if (!bucket) {
        throw new Error('Firebase Storage not initialized');
    }
    return bucket;
};

export default admin;
