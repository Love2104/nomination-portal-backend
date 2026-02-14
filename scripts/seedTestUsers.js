import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';

dotenv.config();

const seedTestUsers = async () => {
    try {
        await connectDB();
        console.log('🔌 DB Connected');

        const testUsers = [
            {
                name: 'Student One',
                email: 'student1@iitk.ac.in',
                rollNo: '100001',
                department: 'CSE',
                phone: '9000000001',
            },
            {
                name: 'Student Two',
                email: 'student2@iitk.ac.in',
                rollNo: '100002',
                department: 'EE',
                phone: '9000000002',
            },
            {
                name: 'Student Three',
                email: 'student3@iitk.ac.in',
                rollNo: '100003',
                department: 'ME',
                phone: '9000000003',
            },
            {
                name: 'Student Four',
                email: 'student4@iitk.ac.in',
                rollNo: '100004',
                department: 'CE',
                phone: '9000000004',
            },
            {
                name: 'Student Five',
                email: 'student5@iitk.ac.in',
                rollNo: '100005',
                department: 'CHM',
                phone: '9000000005',
            }
        ];

        const commonPassword = 'password123';

        console.log('🌱 Seeding test users...');

        for (const user of testUsers) {
            // Check if user exists
            const existingUser = await User.findOne({
                where: {
                    email: user.email
                }
            });

            if (existingUser) {
                console.log(`⚠️  User ${user.email} already exists. Skipping.`);
                continue;
            }

            await User.create({
                ...user,
                password: commonPassword,
                role: 'student',
                isVerified: true
            });

            console.log(`✅ Created ${user.name} (${user.email})`);
        }

        console.log('\n🎉 Test users created successfully!');
        console.log('------------------------------------------------');
        console.log(`Common Password: ${commonPassword}`);
        console.log('------------------------------------------------');
        testUsers.forEach(u => {
            console.log(`Email: ${u.email} | Roll: ${u.rollNo}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding test users:', error);
        process.exit(1);
    }
};

seedTestUsers();
