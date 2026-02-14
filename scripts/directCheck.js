import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('Script started...');

if (!process.env.DB_HOST) {
    console.error('❌ DB_HOST not found in .env');
    process.exit(1);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false } // Important for Neon/AWS sometimes
});

const check = async () => {
    try {
        console.log(`Attempting connect to ${process.env.DB_HOST}...`);
        const res = await pool.query('SELECT name, email, role, password, "isVerified" FROM "Users" WHERE email = $1', ['student1@iitk.ac.in']);

        if (res.rows.length === 0) {
            console.log('❌ User student1@iitk.ac.in NOT FOUND in DB');
        } else {
            console.log('✅ User FOUND:');
            console.log(JSON.stringify(res.rows[0], null, 2));
        }
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ DB Error:', err);
        process.exit(1);
    }
};

check();
