import prisma from '../prisma/client.js';
import jwt from 'jsonwebtoken';
import { logActivity } from '../services/activityService.js';

// @desc    Reviewer login
// @route   POST /api/reviewers/login
// @access  Public
export const reviewerLogin = async (req, res) => {
    try {
        const { username, password, phase } = req.body;

        // Validate phase
        if (!['phase1', 'phase2', 'final'].includes(phase)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phase'
            });
        }

        // Get system config (single row)
        const config = await prisma.systemConfig.findFirst();

        if (!config) {
            return res.status(500).json({
                success: false,
                message: 'System configuration not found'
            });
        }

        // Get credentials for the phase
        const credentialField = `${phase}ReviewerCredentials`;
        const credentials = config[credentialField];

        if (!credentials) {
            return res.status(500).json({
                success: false,
                message: 'Reviewer credentials not configured'
            });
        }

        // Parse credentials if stored as string
        const creds = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;

        // Check credentials
        if (username !== creds.username || password !== creds.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token for reviewer
        const token = jwt.sign(
            {
                type: 'reviewer',
                phase,
                username
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await logActivity({
            action: 'REVIEWER_LOGIN',
            metadata: { username, phase }
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                username,
                phase
            }
        });
    } catch (error) {
        console.error('Reviewer login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Middleware to verify reviewer token
export const verifyReviewer = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'reviewer') {
            return res.status(403).json({
                success: false,
                message: 'Invalid token type'
            });
        }

        req.reviewer = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Phase map for Prisma enum
const phaseMap = {
    phase1: 'PHASE1',
    phase2: 'PHASE2',
    final: 'FINAL'
};

// @desc    Get manifestos for review
// @route   GET /api/reviewers/manifestos
// @access  Private (Reviewer only)
export const getManifestosForReview = async (req, res) => {
    try {
        const { phase } = req.reviewer;
        const prismaPhase = phaseMap[phase];

        const manifestos = await prisma.manifesto.findMany({
            where: { phase: prismaPhase },
            include: {
                nomination: {
                    include: {
                        user: {
                            select: { id: true, name: true, rollNo: true, department: true }
                        }
                    }
                },
                comments: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            phase,
            count: manifestos.length,
            data: manifestos,
            // alias for existing frontend
            manifestos
        });
    } catch (error) {
        console.error('Get manifestos for review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get manifestos',
            error: error.message
        });
    }
};

// @desc    Add comment to manifesto
// @route   POST /api/reviewers/comments
// @access  Private (Reviewer only)
export const addComment = async (req, res) => {
    try {
        const { manifestoId, comment } = req.body;
        const { username, phase } = req.reviewer;
        const prismaPhase = phaseMap[phase];

        // Find manifesto
        const manifesto = await prisma.manifesto.findUnique({
            where: { id: manifestoId }
        });

        if (!manifesto) {
            return res.status(404).json({
                success: false,
                message: 'Manifesto not found'
            });
        }

        // Check if manifesto phase matches reviewer phase
        if (manifesto.phase !== prismaPhase) {
            return res.status(403).json({
                success: false,
                message: 'You can only comment on manifestos for your assigned phase'
            });
        }

        // Create comment — reviewerId is the username string (reviewers don't have User accounts)
        const reviewerComment = await prisma.reviewerComment.create({
            data: {
                manifestoId,
                reviewerId: username, // This needs to be a valid user ID per schema
                reviewerName: username,
                content: comment
            }
        });

        await logActivity({
            action: 'REVIEWER_COMMENT_ADDED',
            metadata: { manifestoId, reviewer: username, phase }
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: reviewerComment,
            comment: reviewerComment
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment',
            error: error.message
        });
    }
};

// @desc    Get comments for a manifesto
// @route   GET /api/reviewers/comments/:manifestoId
// @access  Public
export const getManifestoComments = async (req, res) => {
    try {
        const { manifestoId } = req.params;

        const comments = await prisma.reviewerComment.findMany({
            where: { manifestoId },
            orderBy: { createdAt: 'desc' }
        });

        // Add legacy-friendly "comment" field for frontend while keeping "content"
        const shaped = comments.map(c => ({
            ...c,
            comment: c.content
        }));

        res.status(200).json({
            success: true,
            count: shaped.length,
            data: shaped,
            comments: shaped
        });
    } catch (error) {
        console.error('Get manifesto comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get comments',
            error: error.message
        });
    }
};
