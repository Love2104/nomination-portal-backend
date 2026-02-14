import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import { randomUUID } from 'crypto';

dotenv.config();

const logFile = 'e:/Web/Nomination portal/backend/reset_all_log.txt';
// Clear log file on start
try { fs.writeFileSync(logFile, ''); } catch (e) { }

const log = (msg) => {
    console.log(msg);
    try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
};

log('🚀 Reset All Users Script Started');

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

const students = [
    { name: 'Student One', email: 'student1@iitk.ac.in', rollNo: '100001', department: 'CSE', phone: '9000000001' },
    { name: 'Student Two', email: 'student2@iitk.ac.in', rollNo: '100002', department: 'EE', phone: '9000000002' },
    { name: 'Student Three', email: 'student3@iitk.ac.in', rollNo: '100003', department: 'ME', phone: '9000000003' },
    { name: 'Student Four', email: 'student4@iitk.ac.in', rollNo: '100004', department: 'CE', phone: '9000000004' },
    { name: 'Student Five', email: 'student5@iitk.ac.in', rollNo: '100005', department: 'CHM', phone: '9000000005' }
];

const run = async () => {
    try {
        log('Connecting to DB...');
        const client = await pool.connect();
        log('✅ Connected');

        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);
        log(`🔑 Generated Hash: ${hashedPassword}`);

        for (const student of students) {
            log(`Processing ${student.email}...`);

            // Try Update
            const updateRes = await client.query(
                'UPDATE "Users" SET password = $1 WHERE email = $2 RETURNING *',
                [hashedPassword, student.email]
            );

            if (updateRes.rowCount > 0) {
                log(`✅ Updated ${student.name}`);
            } else {
                log(`⚠️ ${student.name} not found. Inserting...`);
                // Insert if missing
                const insertRes = await client.query(
                    `INSERT INTO "Users" (id, name, email, password, "rollNo", department, phone, role, "isVerified", "createdAt", "updatedAt")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
                    [randomUUID(), student.name, student.email, hashedPassword, student.rollNo, student.department, student.phone, 'student', true]
                );
                log(`✅ Inserted ${student.name}`);
            }
        }

        client.release();
        await pool.end();
        log('🎉 ALL USERS PROCESSED');
        process.exit(0);
    } catch (err) {
        log(`❌ Error: ${err.message}`);
        process.exit(1);
    }
};

run();
