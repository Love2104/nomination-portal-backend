import prisma from '../prisma/client.js';
import { isNominationOpen } from '../utils/deadlineValidator.js';
import { logActivity } from '../services/activityService.js';

// Helper to normalize positionsApplied from string or array into a CSV string
const normalizePositions = (positionsApplied) => {
    if (!positionsApplied) return '';
    if (Array.isArray(positionsApplied)) {
        return positionsApplied.join(', ');
    }
    return String(positionsApplied);
};

// POST /candidate/nominate
// Create or update the logged-in candidate's nomination (within window)
export const nominate = async (req, res) => {
    try {
        const isOpen = await isNominationOpen();
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: 'Nomination window is closed',
                data: null
            });
        }

        const { cpi, positionsApplied, profilePictureUrl } = req.body;

        const existingNomination = await prisma.nomination.findUnique({
            where: { userId: req.user.id }
        });

        const nominationData = {
            position: normalizePositions(positionsApplied),
            // Store CPI as float internally, accept string values from frontend
            cpi: cpi !== undefined && cpi !== null ? parseFloat(String(cpi)) : 0
        };

        let nomination;

        if (existingNomination) {
            if (existingNomination.nominationLocked) {
                return res.status(400).json({
                    success: false,
                    message: 'Nomination is locked and cannot be updated',
                    data: null
                });
            }

            nomination = await prisma.nomination.update({
                where: { id: existingNomination.id },
                data: nominationData
            });
        } else {
            nomination = await prisma.nomination.create({
                data: {
                    user: { connect: { id: req.user.id } },
                    ...nominationData,
                    status: 'PENDING'
                }
            });
        }

        await logActivity({
            userId: req.user.id,
            action: existingNomination ? 'NOMINATION_UPDATED' : 'NOMINATION_CREATED',
            metadata: { nominationId: nomination.id }
        });

        // Optionally update candidate profile picture
        if (profilePictureUrl) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: { profilePic: profilePictureUrl }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Nomination saved successfully',
            data: nomination
        });
    } catch (error) {
        console.error('Candidate nominate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save nomination',
            data: null
        });
    }
};

// PATCH /candidate/update
// Update nomination fields for logged-in candidate (respects lock + deadline)
export const updateNominationDetails = async (req, res) => {
    try {
        const isOpen = await isNominationOpen();
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: 'Nomination window is closed',
                data: null
            });
        }

        const nomination = await prisma.nomination.findUnique({
            where: { userId: req.user.id }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'No nomination found for candidate',
                data: null
            });
        }

        if (nomination.nominationLocked) {
            return res.status(400).json({
                success: false,
                message: 'Nomination is locked and cannot be updated',
                data: null
            });
        }

        const { cpi, positionsApplied, nominationLocked } = req.body;

        const updateData = {};
        if (positionsApplied !== undefined) {
            updateData.position = normalizePositions(positionsApplied);
        }
        if (cpi !== undefined && cpi !== null) {
            updateData.cpi = parseFloat(String(cpi));
        }
        if (typeof nominationLocked === 'boolean') {
            updateData.nominationLocked = nominationLocked;
        }

        const updated = await prisma.nomination.update({
            where: { id: nomination.id },
            data: updateData
        });

        await logActivity({
            userId: req.user.id,
            action: 'NOMINATION_UPDATED',
            metadata: { nominationId: nomination.id }
        });

        return res.status(200).json({
            success: true,
            message: 'Nomination updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Candidate update nomination error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update nomination',
            data: null
        });
    }
};

// GET /candidate/dashboard
// Candidate dashboard aggregate view
export const getDashboard = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                rollNo: true,
                department: true,
                profilePic: true,
                role: true,
                nomination: {
                    include: {
                        supporterRequests: true,
                        manifestos: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Candidate dashboard data',
            data: user
        });
    } catch (error) {
        console.error('Candidate dashboard error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            data: null
        });
    }
};

