import prisma from '../prisma/client.js';
import { logActivity } from '../services/activityService.js';

// PATCH /admin/nomination-status
// Body: { candidateId, status: 'PENDING' | 'ACCEPTED' | 'REJECTED' }
// Access: admin or superadmin (enforced by middleware)
export const updateNominationStatus = async (req, res) => {
    try {
        const { candidateId, status } = req.body;

        if (!candidateId || !['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'candidateId and valid status are required',
                data: null
            });
        }

        const nomination = await prisma.nomination.findUnique({
            where: { userId: candidateId }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'Nomination not found for candidate',
                data: null
            });
        }

        const updated = await prisma.nomination.update({
            where: { id: nomination.id },
            data: { status }
        });

        await logActivity({
            userId: req.user.id,
            action: 'NOMINATION_STATUS_CHANGED',
            metadata: { nominationId: nomination.id, status }
        });

        return res.status(200).json({
            success: true,
            message: `Nomination status updated to ${status.toLowerCase()}`,
            data: updated
        });
    } catch (error) {
        console.error('Admin nomination-status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update nomination status',
            data: null
        });
    }
};

