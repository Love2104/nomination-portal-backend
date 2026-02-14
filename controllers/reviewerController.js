import { Manifesto, ReviewerComment, Nomination, User, SystemConfig } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

        // Get system config
        const config = await SystemConfig.findOne();

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

        // Check credentials
        if (username !== credentials.username || password !== credentials.password) {
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

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            reviewer: {
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

// @desc    Get manifestos for review
// @route   GET /api/reviewers/manifestos
// @access  Private (Reviewer only)
export const getManifestosForReview = async (req, res) => {
    try {
        const { phase } = req.reviewer;

        const manifestos = await Manifesto.findAll({
            where: { phase },
            include: [
                {
                    model: Nomination,
                    include: [
                        {
                            model: User,
                            as: 'candidate',
                            attributes: ['id', 'name', 'rollNo', 'department']
                        }
                    ]
                }
            ],
            order: [['uploadedAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            phase,
            count: manifestos.length,
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

        // Find manifesto
        const manifesto = await Manifesto.findByPk(manifestoId);

        if (!manifesto) {
            return res.status(404).json({
                success: false,
                message: 'Manifesto not found'
            });
        }

        // Check if manifesto phase matches reviewer phase
        if (manifesto.phase !== phase) {
            return res.status(403).json({
                success: false,
                message: 'You can only comment on manifestos for your assigned phase'
            });
        }

        // Create comment
        const reviewerComment = await ReviewerComment.create({
            manifestoId,
            reviewerId: username,
            reviewerName: username,
            comment
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
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

        const comments = await ReviewerComment.findAll({
            where: { manifestoId },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: comments.length,
            comments
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
