import { Nomination, User } from '../models/index.js';
import { isNominationOpen } from '../utils/deadlineValidator.js';

// @desc    Create nomination
// @route   POST /api/nominations
// @access  Private (Candidate only)
export const createNomination = async (req, res) => {
    try {
        const { positions } = req.body;

        // Check if nomination period is open
        const isOpen = await isNominationOpen();
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: 'Nomination period is not currently open'
            });
        }

        // Check if user is a candidate
        if (req.user.role !== 'candidate') {
            return res.status(403).json({
                success: false,
                message: 'Only candidates can create nominations'
            });
        }

        // Check if nomination already exists
        const existingNomination = await Nomination.findOne({
            where: { userId: req.user.id }
        });

        if (existingNomination) {
            return res.status(400).json({
                success: false,
                message: 'You have already created a nomination. Use update endpoint to modify it.'
            });
        }

        // Create nomination
        const nomination = await Nomination.create({
            userId: req.user.id,
            positions,
            status: 'draft'
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
        const { positions } = req.body;

        // Check if nomination period is open
        const isOpen = await isNominationOpen();
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: 'Nomination period has ended. Cannot update nomination.'
            });
        }

        // Find nomination
        const nomination = await Nomination.findByPk(id);

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

        // Check if nomination is locked
        if (nomination.status === 'locked') {
            return res.status(403).json({
                success: false,
                message: 'Nomination is locked and cannot be updated'
            });
        }

        // Update nomination
        await nomination.update({ positions });

        res.status(200).json({
            success: true,
            message: 'Nomination updated successfully',
            nomination
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
        const nomination = await Nomination.findByPk(id);

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

        // Update status to submitted
        await nomination.update({ status: 'submitted' });

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

        const nomination = await Nomination.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'candidate',
                    attributes: ['id', 'name', 'email', 'rollNo', 'department']
                }
            ]
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
        const nomination = await Nomination.findOne({
            where: { userId: req.user.id },
            include: [
                {
                    model: User,
                    as: 'candidate',
                    attributes: ['id', 'name', 'email', 'rollNo', 'department']
                }
            ]
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

// @desc    Get all nominations
// @route   GET /api/nominations
// @access  Public
export const getAllNominations = async (req, res) => {
    try {
        const nominations = await Nomination.findAll({
            where: { status: ['submitted', 'locked', 'verified'] },
            include: [
                {
                    model: User,
                    as: 'candidate',
                    attributes: ['id', 'name', 'email', 'rollNo', 'department']
                }
            ],
            order: [['createdAt', 'DESC']]
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
