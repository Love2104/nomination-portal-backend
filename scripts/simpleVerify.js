import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const verify = async () => {
    try {
        await connectDB();
        const count = await User.count({ where: { role: 'student' } });
        const filePath = path.resolve('simple_verify.txt');
        fs.writeFileSync(filePath, `Count: ${count}`);
        console.log(`Wrote to ${filePath}`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verify();
