import prisma from '../prisma/client.js';

export const logActivity = async ({ userId = null, action, metadata = null }) => {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                metadata
            }
        });
    } catch (error) {
        // Activity logging should never break the main flow
        console.error('Activity log error:', error);
    }
};

