import { connectDB } from '../config/database.js';
import { User, SupporterRequest, Nomination } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const debugSupporters = async () => {
    try {
        console.log('🚀 Starting Debug Supporters Script...');
        await connectDB();
        console.log('✅ DB Connected');

        const email = 'student1@iitk.ac.in';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error('❌ User student1 not found');
            process.exit(1);
        }
        console.log(`✅ User found: ${user.name} (${user.id})`);

        // Check if user has a nomination
        const nomination = await Nomination.findOne({ where: { userId: user.id } });
        if (!nomination) {
            console.log('⚠️ No nomination found for this user. They might not be a candidate yet.');
        } else {
            console.log(`✅ Nomination found: ${nomination.status}`);
        }

        // Try fetching supporters using Sequelize
        console.log('🔍 Fetching supporters via Sequelize...');
        try {
            const requests = await SupporterRequest.findAll({
                where: { candidateId: user.id },
                include: [
                    {
                        model: User,
                        as: 'student',
                        attributes: ['id', 'name', 'email', 'rollNo', 'department']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            console.log(`✅ Sequelize fetch success. Count: ${requests.length}`);
            console.log(JSON.stringify(requests, null, 2));
        } catch (err) {
            console.error('❌ Sequelize fetch failed:', err);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Script Error:', error);
        process.exit(1);
    }
};

debugSupporters();
