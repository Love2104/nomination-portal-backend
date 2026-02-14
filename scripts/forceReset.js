import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const logFile = 'e:/Web/Nomination portal/backend/force_reset_log.txt';
const log = (msg) => {
    console.log(msg);
    try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
};

log('🚀 Force Reset Script Started');

if (!process.env.DB_HOST) {
    log('❌ DB_HOST missing');
    process.exit(1);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

const run = async () => {
    try {
        log('Connecting to DB...');
        const client = await pool.connect();
        log('✅ Connected');

        const email = 'student1@iitk.ac.in';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);
        log(`🔑 Generated Hash: ${hashedPassword}`);

        // Try Update
        const updateRes = await client.query(
            'UPDATE "Users" SET password = $1 WHERE email = $2 RETURNING *',
            [hashedPassword, email]
        );

        if (updateRes.rowCount > 0) {
            log('✅ User updated successfully!');
            log(`Row: ${JSON.stringify(updateRes.rows[0])}`);
        } else {
            log('⚠️ User not found. Inserting...');
            const insertRes = await client.query(
                `INSERT INTO "Users" (name, email, password, "rollNo", department, phone, role, "isVerified", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
                ['Student One', email, hashedPassword, '100001', 'CSE', '9000000001', 'student', true]
            );
            log('✅ User inserted successfully!');
            log(`Row: ${JSON.stringify(insertRes.rows[0])}`);
        }

        client.release();
        await pool.end();
        log('🎉 DONE');
        process.exit(0);
    } catch (err) {
        log(`❌ Error: ${err.message}`);
        process.exit(1);
    }
};

run();
