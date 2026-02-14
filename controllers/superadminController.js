import { SystemConfig, User, Nomination, SupporterRequest, Manifesto, ReviewerComment } from '../models/index.js';
import { Parser } from 'json2csv';

// @desc    Get system configuration
// @route   GET /api/superadmin/config
// @access  Private (Superadmin only)
export const getConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();

        if (!config) {
            config = await SystemConfig.create({});
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
        const deadlines = req.body;

        let config = await SystemConfig.findOne();

        if (!config) {
            config = await SystemConfig.create({});
        }

        await config.update(deadlines);

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

// @desc    Update supporter limits
// @route   PUT /api/superadmin/config/limits
// @access  Private (Superadmin only)
export const updateLimits = async (req, res) => {
    try {
        const { maxProposers, maxSeconders, maxCampaigners } = req.body;

        let config = await SystemConfig.findOne();

        if (!config) {
            config = await SystemConfig.create({});
        }

        await config.update({
            ...(maxProposers !== undefined && { maxProposers }),
            ...(maxSeconders !== undefined && { maxSeconders }),
            ...(maxCampaigners !== undefined && { maxCampaigners })
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
        const { phase1, phase2, final } = req.body;

        let config = await SystemConfig.findOne();

        if (!config) {
            config = await SystemConfig.create({});
        }

        const updates = {};
        if (phase1) updates.phase1ReviewerCredentials = phase1;
        if (phase2) updates.phase2ReviewerCredentials = phase2;
        if (final) updates.finalReviewerCredentials = final;

        await config.update(updates);

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
// @access  Private (Superadmin only)
export const getAllCandidates = async (req, res) => {
    try {
        const candidates = await User.findAll({
            where: { role: 'candidate' },
            attributes: ['id', 'name', 'email', 'rollNo', 'department', 'createdAt'],
            include: [
                {
                    model: Nomination,
                    include: [
                        {
                            model: SupporterRequest,
                            separate: true
                        },
                        {
                            model: Manifesto,
                            separate: true
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: candidates.length,
            candidates
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
        const totalUsers = await User.count();
        const totalCandidates = await User.count({ where: { role: 'candidate' } });
        const totalNominations = await Nomination.count();
        const submittedNominations = await Nomination.count({ where: { status: 'submitted' } });
        const totalSupporterRequests = await SupporterRequest.count();
        const acceptedSupporters = await SupporterRequest.count({ where: { status: 'accepted' } });
        const totalManifestos = await Manifesto.count();
        const totalComments = await ReviewerComment.count();

        // Get supporter breakdown
        const proposerCount = await SupporterRequest.count({
            where: { role: 'proposer', status: 'accepted' }
        });
        const seconderCount = await SupporterRequest.count({
            where: { role: 'seconder', status: 'accepted' }
        });
        const campaignerCount = await SupporterRequest.count({
            where: { role: 'campaigner', status: 'accepted' }
        });

        // Get manifesto breakdown
        const phase1Manifestos = await Manifesto.count({ where: { phase: 'phase1' } });
        const phase2Manifestos = await Manifesto.count({ where: { phase: 'phase2' } });
        const finalManifestos = await Manifesto.count({ where: { phase: 'final' } });

        res.status(200).json({
            success: true,
            statistics: {
                users: {
                    total: totalUsers,
                    candidates: totalCandidates,
                    students: totalUsers - totalCandidates
                },
                nominations: {
                    total: totalNominations,
                    submitted: submittedNominations,
                    draft: totalNominations - submittedNominations
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
            }
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

// @desc    Export data
// @route   GET /api/superadmin/export/:type
// @access  Private (Superadmin only)
export const exportData = async (req, res) => {
    try {
        const { type } = req.params;
        let data = [];
        let fields = [];

        switch (type) {
            case 'candidates':
                const candidates = await User.findAll({
                    where: { role: 'candidate' },
                    attributes: ['name', 'email', 'rollNo', 'department', 'phone', 'createdAt'],
                    include: [
                        {
                            model: Nomination,
                            attributes: ['positions', 'status', 'proposerCount', 'seconderCount', 'campaignerCount']
                        }
                    ]
                });

                data = candidates.map(c => ({
                    name: c.name,
                    email: c.email,
                    rollNo: c.rollNo,
                    department: c.department,
                    phone: c.phone,
                    positions: c.Nomination?.positions?.join(', ') || '',
                    status: c.Nomination?.status || 'No nomination',
                    proposers: c.Nomination?.proposerCount || 0,
                    seconders: c.Nomination?.seconderCount || 0,
                    campaigners: c.Nomination?.campaignerCount || 0,
                    registeredAt: c.createdAt
                }));

                fields = ['name', 'email', 'rollNo', 'department', 'phone', 'positions', 'status', 'proposers', 'seconders', 'campaigners', 'registeredAt'];
                break;

            case 'supporters':
                const supporters = await SupporterRequest.findAll({
                    include: [
                        {
                            model: User,
                            as: 'student',
                            attributes: ['name', 'email', 'rollNo', 'department']
                        },
                        {
                            model: User,
                            as: 'candidate',
                            attributes: ['name', 'email', 'rollNo']
                        }
                    ]
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

            case 'manifestos':
                const manifestos = await Manifesto.findAll({
                    include: [
                        {
                            model: Nomination,
                            include: [
                                {
                                    model: User,
                                    as: 'candidate',
                                    attributes: ['name', 'email', 'rollNo']
                                }
                            ]
                        }
                    ]
                });

                data = manifestos.map(m => ({
                    candidateName: m.Nomination.candidate.name,
                    candidateRollNo: m.Nomination.candidate.rollNo,
                    phase: m.phase,
                    fileName: m.fileName,
                    fileUrl: m.fileUrl,
                    status: m.status,
                    uploadedAt: m.uploadedAt
                }));

                fields = ['candidateName', 'candidateRollNo', 'phase', 'fileName', 'fileUrl', 'status', 'uploadedAt'];
                break;

            case 'comments':
                const comments = await ReviewerComment.findAll({
                    include: [
                        {
                            model: Manifesto,
                            include: [
                                {
                                    model: Nomination,
                                    include: [
                                        {
                                            model: User,
                                            as: 'candidate',
                                            attributes: ['name', 'rollNo']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });

                data = comments.map(c => ({
                    candidateName: c.Manifesto.Nomination.candidate.name,
                    candidateRollNo: c.Manifesto.Nomination.candidate.rollNo,
                    phase: c.Manifesto.phase,
                    reviewerId: c.reviewerId,
                    reviewerName: c.reviewerName,
                    comment: c.comment,
                    commentedAt: c.createdAt
                }));

                fields = ['candidateName', 'candidateRollNo', 'phase', 'reviewerId', 'reviewerName', 'comment', 'commentedAt'];
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid export type. Use: candidates, supporters, manifestos, or comments'
                });
        }

        // Convert to CSV
        const parser = new Parser({ fields });
        const csv = parser.parse(data);

        // Set headers for download
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
// @access  Private (Superadmin only)
export const getSubmittedNominations = async (req, res) => {
    try {
        const nominations = await Nomination.findAll({
            where: {
                status: ['submitted', 'verified', 'rejected']
            },
            include: [
                {
                    model: User,
                    as: 'candidate',
                    attributes: ['name', 'email', 'rollNo', 'department']
                }
            ],
            order: [['updatedAt', 'DESC']]
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

// @desc    Verify nomination
// @route   PUT /api/superadmin/nominations/:id/verify
// @access  Private (Superadmin only)
export const verifyNomination = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be verified or rejected'
            });
        }

        const nomination = await Nomination.findByPk(id);

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'Nomination not found'
            });
        }

        await nomination.update({ status });

        res.status(200).json({
            success: true,
            message: `Nomination ${status} successfully`,
            nomination
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
