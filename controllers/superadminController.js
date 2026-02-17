import prisma from '../prisma/client.js';
import { Parser } from 'json2csv';
import { logActivity } from '../services/activityService.js';

// @desc    Get system configuration
// @route   GET /api/superadmin/config
// @access  Private (Superadmin only)
export const getConfig = async (req, res) => {
    try {
        let config = await prisma.systemConfig.findFirst();

        if (!config) {
            config = await prisma.systemConfig.create({ data: {} });
        }

        res.status(200).json({
            success: true,
            config
        });
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get configuration',
            error: error.message
        });
    }
};

// @desc    Update deadlines
// @route   PUT /api/superadmin/config/deadlines
// @access  Private (Superadmin only)
export const updateDeadlines = async (req, res) => {
    try {
        const body = req.body;

        // Only pick valid deadline fields and convert to Date objects
        const deadlineFields = [
            'nominationStart', 'nominationEnd',
            'campaignerStart', 'campaignerEnd',
            'manifestoPhase1Start', 'manifestoPhase1End',
            'manifestoPhase2Start', 'manifestoPhase2End',
            'manifestoFinalStart', 'manifestoFinalEnd'
        ];

        // Accept legacy frontend field names (e.g. nominationStartDate) as aliases
        const aliases = {
            nominationStart: ['nominationStartDate'],
            nominationEnd: ['nominationEndDate'],
            campaignerStart: ['campaignerStartDate'],
            campaignerEnd: ['campaignerEndDate'],
            manifestoPhase1Start: ['manifestoPhase1StartDate'],
            manifestoPhase1End: ['manifestoPhase1EndDate'],
            manifestoPhase2Start: ['manifestoPhase2StartDate'],
            manifestoPhase2End: ['manifestoPhase2EndDate'],
            manifestoFinalStart: ['manifestoFinalStartDate'],
            manifestoFinalEnd: ['manifestoFinalEndDate']
        };

        const data = {};
        for (const field of deadlineFields) {
            let raw = body[field];

            if ((raw === undefined || raw === null || raw === '') && aliases[field]) {
                for (const alias of aliases[field]) {
                    if (body[alias]) {
                        raw = body[alias];
                        break;
                    }
                }
            }

            if (raw !== undefined && raw !== null && raw !== '') {
                data[field] = new Date(raw);
            } else if (raw === '' || raw === null) {
                data[field] = null; // allow clearing deadlines
            }
        }

        let config = await prisma.systemConfig.findFirst();

        if (!config) {
            config = await prisma.systemConfig.create({ data });
        } else {
            config = await prisma.systemConfig.update({
                where: { id: config.id },
                data
            });
        }

        await logActivity({
            userId: req.user.id,
            action: 'SYSTEM_DEADLINES_UPDATED',
            metadata: data
        });

        res.status(200).json({
            success: true,
            message: 'Deadlines updated successfully',
            config
        });
    } catch (error) {
        console.error('Update deadlines error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update deadlines',
            error: error.message
        });
    }
};

// @desc    Unified config update (deadlines + limits + reviewer credentials)
// @route   PATCH /superadmin/config
// @access  Private (Superadmin only)
export const updateConfig = async (req, res) => {
    try {
        const body = req.body;

        const dateFields = [
            'nominationStart', 'nominationEnd',
            'campaignerStart', 'campaignerEnd',
            'manifestoPhase1Start', 'manifestoPhase1End',
            'manifestoPhase2Start', 'manifestoPhase2End',
            'manifestoFinalStart', 'manifestoFinalEnd'
        ];

        const aliasMap = {
            nominationStart: ['nominationStartDate'],
            nominationEnd: ['nominationEndDate'],
            campaignerStart: ['campaignerStartDate'],
            campaignerEnd: ['campaignerEndDate'],
            manifestoPhase1Start: ['manifestoPhase1StartDate'],
            manifestoPhase1End: ['manifestoPhase1EndDate'],
            manifestoPhase2Start: ['manifestoPhase2StartDate'],
            manifestoPhase2End: ['manifestoPhase2EndDate'],
            manifestoFinalStart: ['manifestoFinalStartDate'],
            manifestoFinalEnd: ['manifestoFinalEndDate']
        };

        const data = {};

        // Dates
        for (const field of dateFields) {
            let raw = body[field];

            if ((raw === undefined || raw === null || raw === '') && aliasMap[field]) {
                for (const alias of aliasMap[field]) {
                    if (body[alias]) {
                        raw = body[alias];
                        break;
                    }
                }
            }

            if (raw !== undefined && raw !== null && raw !== '') {
                data[field] = new Date(raw);
            } else if (raw === '' || raw === null) {
                data[field] = null;
            }
        }

        // Limits
        if (body.maxProposers !== undefined) data.maxProposers = body.maxProposers;
        if (body.maxSeconders !== undefined) data.maxSeconders = body.maxSeconders;
        if (body.maxCampaigners !== undefined) data.maxCampaigners = body.maxCampaigners;

        // Reviewer credentials
        if (body.phase1ReviewerCredentials) data.phase1ReviewerCredentials = body.phase1ReviewerCredentials;
        if (body.phase2ReviewerCredentials) data.phase2ReviewerCredentials = body.phase2ReviewerCredentials;
        if (body.finalReviewerCredentials) data.finalReviewerCredentials = body.finalReviewerCredentials;

        let config = await prisma.systemConfig.findFirst();

        if (!config) {
            config = await prisma.systemConfig.create({ data });
        } else {
            config = await prisma.systemConfig.update({
                where: { id: config.id },
                data
            });
        }

        await logActivity({
            userId: req.user.id,
            action: 'SYSTEM_CONFIG_UPDATED',
            metadata: data
        });

        return res.status(200).json({
            success: true,
            message: 'System configuration updated successfully',
            config
        });
    } catch (error) {
        console.error('Update config error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update configuration',
            error: error.message
        });
    }
};

// @desc    Update supporter limits
// @route   PUT /api/superadmin/config/limits
// @access  Private (Superadmin only)
export const updateLimits = async (req, res) => {
    try {
        const { maxProposers, maxSeconders, maxCampaigners } = req.body;

        let config = await prisma.systemConfig.findFirst();

        const data = {};
        if (maxProposers !== undefined) data.maxProposers = maxProposers;
        if (maxSeconders !== undefined) data.maxSeconders = maxSeconders;
        if (maxCampaigners !== undefined) data.maxCampaigners = maxCampaigners;

        if (!config) {
            config = await prisma.systemConfig.create({ data });
        } else {
            config = await prisma.systemConfig.update({
                where: { id: config.id },
                data
            });
        }

        await logActivity({
            userId: req.user.id,
            action: 'SYSTEM_LIMITS_UPDATED',
            metadata: data
        });

        res.status(200).json({
            success: true,
            message: 'Supporter limits updated successfully',
            config
        });
    } catch (error) {
        console.error('Update limits error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update limits',
            error: error.message
        });
    }
};

// @desc    Update reviewer credentials
// @route   PUT /api/superadmin/config/reviewers
// @access  Private (Superadmin only)
export const updateReviewerCredentials = async (req, res) => {
    try {
        const { phase1, phase2, final: finalCreds } = req.body;

        let config = await prisma.systemConfig.findFirst();

        const data = {};
        if (phase1) data.phase1ReviewerCredentials = phase1;
        if (phase2) data.phase2ReviewerCredentials = phase2;
        if (finalCreds) data.finalReviewerCredentials = finalCreds;

        if (!config) {
            config = await prisma.systemConfig.create({ data });
        } else {
            config = await prisma.systemConfig.update({
                where: { id: config.id },
                data
            });
        }

        await logActivity({
            userId: req.user.id,
            action: 'REVIEWER_CREDENTIALS_UPDATED',
            metadata: data
        });

        res.status(200).json({
            success: true,
            message: 'Reviewer credentials updated successfully',
            config
        });
    } catch (error) {
        console.error('Update reviewer credentials error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update reviewer credentials',
            error: error.message
        });
    }
};

// @desc    Get all candidates with statistics
// @route   GET /api/superadmin/candidates
// @access  Private (Superadmin/Admin only)
export const getAllCandidates = async (req, res) => {
    try {
        const candidates = await prisma.user.findMany({
            where: { role: 'CANDIDATE' },
            select: {
                id: true,
                name: true,
                email: true,
                rollNo: true,
                department: true,
                profilePic: true,
                createdAt: true,
                nomination: {
                    include: {
                        supporterRequests: true,
                        manifestos: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            count: candidates.length,
            data: candidates
        });
    } catch (error) {
        console.error('Get all candidates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get candidates',
            error: error.message
        });
    }
};

// @desc    Get system statistics
// @route   GET /api/superadmin/statistics
// @access  Private (Superadmin only)
export const getStatistics = async (req, res) => {
    try {
        const [
            totalUsers,
            totalCandidates,
            totalNominations,
            pendingNominations,
            acceptedNominations,
            totalSupporterRequests,
            acceptedSupporters,
            proposerCount,
            seconderCount,
            campaignerCount,
            totalManifestos,
            phase1Manifestos,
            phase2Manifestos,
            finalManifestos,
            totalComments
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'CANDIDATE' } }),
            prisma.nomination.count(),
            prisma.nomination.count({ where: { status: 'PENDING' } }),
            prisma.nomination.count({ where: { status: 'ACCEPTED' } }),
            prisma.supporterRequest.count(),
            prisma.supporterRequest.count({ where: { status: 'ACCEPTED' } }),
            prisma.supporterRequest.count({ where: { role: 'proposer', status: 'ACCEPTED' } }),
            prisma.supporterRequest.count({ where: { role: 'seconder', status: 'ACCEPTED' } }),
            prisma.supporterRequest.count({ where: { role: 'campaigner', status: 'ACCEPTED' } }),
            prisma.manifesto.count(),
            prisma.manifesto.count({ where: { phase: 'PHASE1' } }),
            prisma.manifesto.count({ where: { phase: 'PHASE2' } }),
            prisma.manifesto.count({ where: { phase: 'FINAL' } }),
            prisma.reviewerComment.count()
        ]);

        const statistics = {
            users: {
                total: totalUsers,
                candidates: totalCandidates,
                students: totalUsers - totalCandidates
            },
            nominations: {
                total: totalNominations,
                pending: pendingNominations,
                accepted: acceptedNominations
            },
            supporters: {
                total: totalSupporterRequests,
                accepted: acceptedSupporters,
                pending: totalSupporterRequests - acceptedSupporters,
                breakdown: {
                    proposers: proposerCount,
                    seconders: seconderCount,
                    campaigners: campaignerCount
                }
            },
            manifestos: {
                total: totalManifestos,
                phase1: phase1Manifestos,
                phase2: phase2Manifestos,
                final: finalManifestos
            },
            comments: totalComments
        };

        res.status(200).json({
            success: true,
            data: statistics,
            // alias for existing frontend
            statistics
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};

// @desc    Export data as CSV
// @route   GET /api/superadmin/export/:type
// @access  Private (Superadmin only)
export const exportData = async (req, res) => {
    try {
        const { type } = req.params;
        let data = [];
        let fields = [];

        switch (type) {
            case 'candidates': {
                const candidates = await prisma.user.findMany({
                    where: { role: 'CANDIDATE' },
                    select: {
                        name: true, email: true, rollNo: true, department: true, contact: true, createdAt: true,
                        nomination: {
                            select: {
                                position: true, cpi: true, status: true,
                                supporterRequests: { where: { status: 'ACCEPTED' } }
                            }
                        }
                    }
                });

                data = candidates.map(c => {
                    const acceptedByRole = (r) => c.nomination?.supporterRequests?.filter(s => s.role === r).length || 0;
                    return {
                        name: c.name,
                        email: c.email,
                        rollNo: c.rollNo,
                        department: c.department,
                        phone: c.contact || '',
                        position: c.nomination?.position || '',
                        cpi: c.nomination?.cpi || '',
                        status: c.nomination?.status || 'No nomination',
                        proposers: acceptedByRole('proposer'),
                        seconders: acceptedByRole('seconder'),
                        campaigners: acceptedByRole('campaigner'),
                        registeredAt: c.createdAt
                    };
                });

                fields = ['name', 'email', 'rollNo', 'department', 'phone', 'position', 'cpi', 'status', 'proposers', 'seconders', 'campaigners', 'registeredAt'];
                break;
            }

            case 'supporters': {
                const supporters = await prisma.supporterRequest.findMany({
                    include: {
                        student: { select: { name: true, email: true, rollNo: true, department: true } },
                        candidate: { select: { name: true, email: true, rollNo: true } }
                    }
                });

                data = supporters.map(s => ({
                    studentName: s.student.name,
                    studentEmail: s.student.email,
                    studentRollNo: s.student.rollNo,
                    studentDepartment: s.student.department,
                    candidateName: s.candidate.name,
                    candidateRollNo: s.candidate.rollNo,
                    role: s.role,
                    status: s.status,
                    requestedAt: s.createdAt
                }));

                fields = ['studentName', 'studentEmail', 'studentRollNo', 'studentDepartment', 'candidateName', 'candidateRollNo', 'role', 'status', 'requestedAt'];
                break;
            }

            case 'manifestos': {
                const manifestos = await prisma.manifesto.findMany({
                    include: {
                        nomination: {
                            include: {
                                user: { select: { name: true, email: true, rollNo: true } }
                            }
                        }
                    }
                });

                data = manifestos.map(m => ({
                    candidateName: m.nomination.user.name,
                    candidateRollNo: m.nomination.user.rollNo,
                    phase: m.phase,
                    fileName: m.fileName,
                    fileUrl: m.fileUrl,
                    status: m.status,
                    uploadedAt: m.createdAt
                }));

                fields = ['candidateName', 'candidateRollNo', 'phase', 'fileName', 'fileUrl', 'status', 'uploadedAt'];
                break;
            }

            case 'comments': {
                const comments = await prisma.reviewerComment.findMany({
                    include: {
                        manifesto: {
                            include: {
                                nomination: {
                                    include: {
                                        user: { select: { name: true, rollNo: true } }
                                    }
                                }
                            }
                        }
                    }
                });

                data = comments.map(c => ({
                    candidateName: c.manifesto.nomination.user.name,
                    candidateRollNo: c.manifesto.nomination.user.rollNo,
                    phase: c.manifesto.phase,
                    reviewerName: c.reviewerName,
                    comment: c.content,
                    commentedAt: c.createdAt
                }));

                fields = ['candidateName', 'candidateRollNo', 'phase', 'reviewerName', 'comment', 'commentedAt'];
                break;
            }

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid export type. Use: candidates, supporters, manifestos, or comments'
                });
        }

        // Convert to CSV
        const parser = new Parser({ fields });
        const csv = parser.parse(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_export_${Date.now()}.csv`);

        res.status(200).send(csv);
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export data',
            error: error.message
        });
    }
};

// @desc    Get all submitted nominations
// @route   GET /api/superadmin/nominations
// @access  Private (Superadmin/Admin only)
export const getSubmittedNominations = async (req, res) => {
    try {
        const nominations = await prisma.nomination.findMany({
            include: {
                user: {
                    select: { id: true, name: true, email: true, rollNo: true, department: true, profilePic: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            count: nominations.length,
            nominations
        });
    } catch (error) {
        console.error('Get submitted nominations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get nominations',
            error: error.message
        });
    }
};

// @desc    Accept or reject nomination
// @route   PUT /api/superadmin/nominations/:id/verify
// @access  Private (Superadmin/Admin only)
export const verifyNomination = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACCEPTED' or 'REJECTED'

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be ACCEPTED or REJECTED'
            });
        }

        const nomination = await prisma.nomination.findUnique({
            where: { id }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'Nomination not found'
            });
        }

        const updatedNomination = await prisma.nomination.update({
            where: { id },
            data: { status },
            include: {
                user: {
                    select: { id: true, name: true, email: true, rollNo: true }
                }
            }
        });

        await logActivity({
            userId: req.user.id,
            action: 'NOMINATION_STATUS_CHANGED',
            metadata: { nominationId: id, status }
        });

        res.status(200).json({
            success: true,
            message: `Nomination ${status.toLowerCase()} successfully`,
            data: updatedNomination
        });
    } catch (error) {
        console.error('Verify nomination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify nomination',
            error: error.message
        });
    }
};

// @desc    Create admin account
// @route   POST /api/superadmin/create-admin
// @access  Private (Superadmin only)
export const createAdmin = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
            return res.status(400).json({
                success: false,
                message: `User is already ${user.role}`
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: 'ADMIN' }
        });

        await logActivity({
            userId: req.user.id,
            action: 'ADMIN_CREATED',
            metadata: { userId }
        });

        res.status(200).json({
            success: true,
            message: 'Admin account created successfully',
            data: { ...updatedUser, password: undefined }
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin',
            error: error.message
        });
    }
};

// @desc    List all users (for admin assignment)
// @route   GET /api/superadmin/users
// @access  Private (Superadmin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                rollNo: true,
                department: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
};
