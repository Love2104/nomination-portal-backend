import prisma from '../prisma/client.js';
import { isNominationOpen } from '../utils/deadlineValidator.js';
import { logActivity } from '../services/activityService.js';

// @desc    Create nomination
// @route   POST /api/nominations
// @access  Private (Candidate only)
export const createNomination = async (req, res) => {
    try {
        // Accept both 'position' (string) and 'positions' (array) from frontend
        const position = req.body.position || (Array.isArray(req.body.positions) ? req.body.positions.join(', ') : '');
        const cpi = req.body.cpi;

        // Check if nomination period is open
        const isOpen = await isNominationOpen();
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: 'Nomination period is not currently open'
            });
        }

        // Check if nomination already exists
        const existingNomination = await prisma.nomination.findUnique({
            where: { userId: req.user.id }
        });

        if (existingNomination) {
            return res.status(400).json({
                success: false,
                message: 'You have already created a nomination. Use update endpoint to modify it.'
            });
        }

        // Create nomination
        const nomination = await prisma.nomination.create({
            data: {
                user: { connect: { id: req.user.id } },
                position: position || 'Not specified',
                cpi: cpi ? parseFloat(cpi) : 0,
                status: 'PENDING'
            }
        });

        await logActivity({
            userId: req.user.id,
            action: 'NOMINATION_CREATED',
            metadata: { nominationId: nomination.id }
        });

        res.status(201).json({
            success: true,
            message: 'Nomination created successfully',
            nomination
        });
    } catch (error) {
        console.error('Create nomination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create nomination',
            error: error.message
        });
    }
};

// @desc    Update nomination
// @route   PUT /api/nominations/:id
// @access  Private (Candidate only)
export const updateNomination = async (req, res) => {
    try {
        const { id } = req.params;
        // Accept both 'position' (string) and 'positions' (array) from frontend
        const position = req.body.position || (Array.isArray(req.body.positions) ? req.body.positions.join(', ') : undefined);
        const cpi = req.body.cpi;

        // Check if nomination period is open
        const isOpen = await isNominationOpen();
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: 'Nomination period has ended. Cannot update nomination.'
            });
        }

        // Find nomination
        const nomination = await prisma.nomination.findUnique({
            where: { id }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'Nomination not found'
            });
        }

        // Check ownership
        if (nomination.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own nomination'
            });
        }

        // Update nomination data
        const updateData = {};
        if (position) updateData.position = position;
        if (cpi !== undefined && cpi !== null) updateData.cpi = parseFloat(cpi);

        const updatedNomination = await prisma.nomination.update({
            where: { id },
            data: updateData
        });

        await logActivity({
            userId: req.user.id,
            action: 'NOMINATION_UPDATED',
            metadata: { nominationId: id }
        });

        res.status(200).json({
            success: true,
            message: 'Nomination updated successfully',
            nomination: updatedNomination
        });
    } catch (error) {
        console.error('Update nomination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update nomination',
            error: error.message
        });
    }
};

// @desc    Submit nomination
// @route   POST /api/nominations/:id/submit
// @access  Private (Candidate only)
export const submitNomination = async (req, res) => {
    try {
        const { id } = req.params;

        // Find nomination
        const nomination = await prisma.nomination.findUnique({
            where: { id }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'Nomination not found'
            });
        }

        // Check ownership
        if (nomination.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only submit your own nomination'
            });
        }

        // Update status to submitted (In schema status is Enum ApplicationStatus: PENDING, ACCEPTED, REJECTED)
        // Wait, draft/submitted logic isn't in Enum.
        // I will assume PENDING = Submitted/Under Review.
        // User prompt validation says: "Admins can ACCEPT or REJECT". "Nomination editing allowed only before deadline."
        // So effectively, if within deadline, they can edit.
        // I won't change status to 'submitted' if it's not in Enum.
        // But maybe I should let them "lock" it?
        // Prompt says: "Nomination editing allowed only before nomination deadline."
        // So validator handles that.
        // I'll just check deadline.
        // But for explicit "Submit" action, maybe just ensure it's saved?
        // Or maybe this endpoint isn't needed if "Update" does the job.
        // But let's allow "locking" or just acknowledge.
        // Actually, schema has ApplicationStatus: PENDING, ACCEPTED, REJECTED.
        // So PENDING is default.
        // I'll keep it as PENDING.

        await logActivity({
            userId: req.user.id,
            action: 'NOMINATION_SUBMITTED',
            metadata: { nominationId: id }
        });

        res.status(200).json({
            success: true,
            message: 'Nomination submitted successfully',
            nomination
        });
    } catch (error) {
        console.error('Submit nomination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit nomination',
            error: error.message
        });
    }
};

// @desc    Get nomination details
// @route   GET /api/nominations/:id
// @access  Public
export const getNomination = async (req, res) => {
    try {
        const { id } = req.params;

        const nomination = await prisma.nomination.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true, profilePic: true }
                }
            }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'Nomination not found'
            });
        }

        res.status(200).json({
            success: true,
            nomination
        });
    } catch (error) {
        console.error('Get nomination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get nomination',
            error: error.message
        });
    }
};

// @desc    Get current user's nomination
// @route   GET /api/nominations/my-nomination
// @access  Private (Candidate only)
export const getMyNomination = async (req, res) => {
    try {
        const nomination = await prisma.nomination.findUnique({
            where: { userId: req.user.id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true, profilePic: true }
                }
            }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'No nomination found'
            });
        }

        res.status(200).json({
            success: true,
            nomination
        });
    } catch (error) {
        console.error('Get my nomination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get nomination',
            error: error.message
        });
    }
};

// @desc    Get all nominations (Public/Admin)
// @route   GET /api/nominations
// @access  Public
export const getAllNominations = async (req, res) => {
    try {
        const nominations = await prisma.nomination.findMany({
            where: {
                status: 'ACCEPTED'
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true, profilePic: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            count: nominations.length,
            nominations
        });
    } catch (error) {
        console.error('Get all nominations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get nominations',
            error: error.message
        });
    }
};
