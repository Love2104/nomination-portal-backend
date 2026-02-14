import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const verify = async () => {
    try {
        await connectDB();
        const count = await User.count({ where: { role: 'student' } });

        let output = `Total Student Users: ${count}\n\n`;

        const targetEmails = [
            'student1@iitk.ac.in',
            'student2@iitk.ac.in',
            'student3@iitk.ac.in',
            'student4@iitk.ac.in',
            'student5@iitk.ac.in'
        ];

        const users = await User.findAll({
            where: { email: targetEmails },
            attributes: ['name', 'email', 'rollNo', 'role'],
            order: [['email', 'ASC']]
        });

        if (users.length === 0) {
            output += "No test users found!\n";
        } else {
            output += "Found Users:\n";
            users.forEach(u => {
                output += `- ${u.name} (${u.email}) [${u.role}]\n`;
            });
        }

        fs.writeFileSync('scripts/verification_result.txt', output);
        console.log('Verification result written to file.');
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('scripts/verification_result.txt', `Error: ${e.message}`);
        console.error(e);
        process.exit(1);
    }
};

verify();
