import prisma from '../prisma/client.js';
import { isSupporterRoleOpen, getSystemConfig } from '../utils/deadlineValidator.js';
import { logActivity } from '../services/activityService.js';

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
        const nomination = await prisma.nomination.findUnique({
            where: { userId: candidateId }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'Candidate nomination not found'
            });
        }

        // Check if request already exists
        const existingRequest = await prisma.supporterRequest.findUnique({
            where: {
                studentId_nominationId_role: {
                    studentId: req.user.id,
                    nominationId: nomination.id,
                    role
                }
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: `You have already requested to be a ${role} for this candidate`
            });
        }

        // Create supporter request
        const supporterRequest = await prisma.supporterRequest.create({
            data: {
                studentId: req.user.id,
                candidateId,
                nominationId: nomination.id,
                role,
                status: 'PENDING'
            },
            include: {
                student: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true }
                },
                candidate: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true }
                }
            }
        });

        await logActivity({
            userId: req.user.id,
            action: 'SUPPORTER_REQUEST_CREATED',
            metadata: { supporterRequestId: supporterRequest.id, role }
        });

        res.status(201).json({
            success: true,
            message: 'Supporter request sent successfully',
            data: supporterRequest
        });
    } catch (error) {
        console.error('Request supporter role error:', error);

        // Handle unique constraint errors (Prisma P2002)
        if (error.code === 'P2002') {
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

        // Find request with nomination
        const request = await prisma.supporterRequest.findUnique({
            where: { id },
            include: { nomination: true }
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
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${request.status.toLowerCase()}`
            });
        }

        // Get system config for limits
        const config = await getSystemConfig();

        // Check supporter limits
        const limitMap = {
            proposer: config.maxProposers,
            seconder: config.maxSeconders,
            campaigner: config.maxCampaigners
        };

        // Count current accepted supporters for this role
        const currentCount = await prisma.supporterRequest.count({
            where: {
                nominationId: request.nominationId,
                role: request.role,
                status: 'ACCEPTED'
            }
        });

        if (currentCount >= limitMap[request.role]) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${request.role} limit reached (${limitMap[request.role]})`
            });
        }

        // Accept request
        const updatedRequest = await prisma.supporterRequest.update({
            where: { id },
            data: { status: 'ACCEPTED' },
            include: {
                student: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true }
                }
            }
        });

        await logActivity({
            userId: req.user.id,
            action: 'SUPPORTER_REQUEST_ACCEPTED',
            metadata: { supporterRequestId: id, role: request.role }
        });

        res.status(200).json({
            success: true,
            message: 'Supporter request accepted',
            data: updatedRequest
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
        const request = await prisma.supporterRequest.findUnique({
            where: { id }
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
                message: 'You can only reject requests for your own nomination'
            });
        }

        // Check if already processed
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${request.status.toLowerCase()}`
            });
        }

        // Reject request
        const updatedRequest = await prisma.supporterRequest.update({
            where: { id },
            data: { status: 'REJECTED' }
        });

        await logActivity({
            userId: req.user.id,
            action: 'SUPPORTER_REQUEST_REJECTED',
            metadata: { supporterRequestId: id }
        });

        res.status(200).json({
            success: true,
            message: 'Supporter request rejected',
            data: updatedRequest
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

        const requests = await prisma.supporterRequest.findMany({
            where: { candidateId },
            include: {
                student: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests,
            // alias for existing frontend
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
        const requests = await prisma.supporterRequest.findMany({
            where: { studentId: req.user.id },
            include: {
                candidate: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
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

// @desc    Generic supporter respond endpoint (accept/reject)
// @route   PATCH /supporter/respond
// @access  Private (Candidate only)
export const respondSupporterRequest = async (req, res) => {
    try {
        const { supporterId, action } = req.body;

        if (!supporterId || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'supporterId and valid action (accept/reject) are required'
            });
        }

        // Reuse existing handlers by setting params.id
        req.params = req.params || {};
        req.params.id = supporterId;

        if (action === 'accept') {
            return acceptSupporterRequest(req, res);
        }
        return rejectSupporterRequest(req, res);
    } catch (error) {
        console.error('Respond supporter request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process supporter response',
            error: error.message
        });
    }
};
