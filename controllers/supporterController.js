import { SupporterRequest, Nomination, User, SystemConfig } from '../models/index.js';
import { isSupporterRoleOpen, getSystemConfig } from '../utils/deadlineValidator.js';

// @desc    Request supporter role
// @route   POST /api/supporters/request
// @access  Private (Student)
export const requestSupporterRole = async (req, res) => {
    try {
        const { candidateId, role } = req.body;

        // Check if deadline is open for this role
        const isOpen = await isSupporterRoleOpen(role);
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: `${role} request period is not currently open`
            });
        }

        // Find candidate's nomination
        const nomination = await Nomination.findOne({
            where: { userId: candidateId }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'Candidate nomination not found'
            });
        }

        // Check if request already exists
        const existingRequest = await SupporterRequest.findOne({
            where: {
                studentId: req.user.id,
                nominationId: nomination.id,
                role
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: `You have already requested to be a ${role} for this candidate`
            });
        }

        // Create supporter request
        const supporterRequest = await SupporterRequest.create({
            studentId: req.user.id,
            candidateId,
            nominationId: nomination.id,
            role,
            status: 'pending'
        });

        // Populate student and candidate info
        const populatedRequest = await SupporterRequest.findByPk(supporterRequest.id, {
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email', 'rollNo', 'department']
                },
                {
                    model: User,
                    as: 'candidate',
                    attributes: ['id', 'name', 'email', 'rollNo', 'department']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Supporter request sent successfully',
            request: populatedRequest
        });
    } catch (error) {
        console.error('Request supporter role error:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'You have already requested this role for this candidate'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to send supporter request',
            error: error.message
        });
    }
};

// @desc    Accept supporter request
// @route   PUT /api/supporters/:id/accept
// @access  Private (Candidate only)
export const acceptSupporterRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // Find request
        const request = await SupporterRequest.findByPk(id, {
            include: [
                {
                    model: Nomination,
                    required: true
                }
            ]
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Supporter request not found'
            });
        }

        // Check if user is the candidate
        if (request.candidateId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only accept requests for your own nomination'
            });
        }

        // Check if already processed
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${request.status}`
            });
        }

        // Get system config for limits
        const config = await getSystemConfig();
        const nomination = request.Nomination;

        // Check supporter limits
        const roleCountField = `${request.role}Count`;
        const maxRoleField = `max${request.role.charAt(0).toUpperCase() + request.role.slice(1)}s`;

        if (nomination[roleCountField] >= config[maxRoleField]) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${request.role} limit reached (${config[maxRoleField]})`
            });
        }

        // Accept request
        await request.update({ status: 'accepted' });

        // Increment supporter count
        await nomination.increment(roleCountField);

        // Reload nomination
        await nomination.reload();

        res.status(200).json({
            success: true,
            message: 'Supporter request accepted',
            request,
            nomination
        });
    } catch (error) {
        console.error('Accept supporter request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept supporter request',
            error: error.message
        });
    }
};

// @desc    Reject supporter request
// @route   PUT /api/supporters/:id/reject
// @access  Private (Candidate only)
export const rejectSupporterRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // Find request
        const request = await SupporterRequest.findByPk(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Supporter request not found'
            });
        }

        // Check if user is the candidate
        if (request.candidateId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only reject requests for your own nomination'
            });
        }

        // Check if already processed
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${request.status}`
            });
        }

        // Reject request
        await request.update({ status: 'rejected' });

        res.status(200).json({
            success: true,
            message: 'Supporter request rejected',
            request
        });
    } catch (error) {
        console.error('Reject supporter request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject supporter request',
            error: error.message
        });
    }
};

// @desc    Get supporter requests for candidate
// @route   GET /api/supporters/candidate/:candidateId
// @access  Public
export const getCandidateSupporters = async (req, res) => {
    try {
        const { candidateId } = req.params;

        const requests = await SupporterRequest.findAll({
            where: { candidateId },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email', 'rollNo', 'department']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error('Get candidate supporters error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get supporter requests',
            error: error.message
        });
    }
};

// @desc    Get my supporter requests
// @route   GET /api/supporters/my-requests
// @access  Private
export const getMyRequests = async (req, res) => {
    try {
        const requests = await SupporterRequest.findAll({
            where: { studentId: req.user.id },
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
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get your requests',
            error: error.message
        });
    }
};
