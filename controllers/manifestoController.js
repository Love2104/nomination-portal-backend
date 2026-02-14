import { Manifesto, Nomination, ReviewerComment } from '../models/index.js';
import { getPhaseDeadlineStatus } from '../utils/deadlineValidator.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryStorage.js';
import https from 'https';
import http from 'http';

// @desc    Upload manifesto
// @route   POST /api/manifestos/upload
// @access  Private (Candidate only)
export const uploadManifesto = async (req, res) => {
    try {
        const { phase } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a PDF file'
            });
        }

        // Validate phase
        if (!['phase1', 'phase2', 'final'].includes(phase)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phase. Must be phase1, phase2, or final'
            });
        }

        // Check if deadline is open for this phase
        const isOpen = await getPhaseDeadlineStatus(phase);
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: `Manifesto ${phase} submission period is not currently open`
            });
        }

        // Find candidate's nomination
        const nomination = await Nomination.findOne({
            where: { userId: req.user.id }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'No nomination found. Please create a nomination first.'
            });
        }

        // Check if manifesto already exists for this phase
        const existingManifesto = await Manifesto.findOne({
            where: {
                nominationId: nomination.id,
                phase
            }
        });

        // If exists and locked, cannot update
        if (existingManifesto && existingManifesto.status === 'locked') {
            return res.status(403).json({
                success: false,
                message: `Manifesto for ${phase} is locked and cannot be updated`
            });
        }

        // Upload to Cloudinary
        const { fileUrl, publicId, fileName } = await uploadToCloudinary(
            req.file.buffer,
            req.file.originalname,
            `manifestos/${phase}`
        );

        // If updating existing manifesto, delete old file
        if (existingManifesto) {
            await deleteFromCloudinary(existingManifesto.firebasePath);
            await existingManifesto.update({
                fileName,
                fileUrl,
                firebasePath: publicId,
                uploadedAt: new Date()
            });

            return res.status(200).json({
                success: true,
                message: 'Manifesto updated successfully',
                manifesto: existingManifesto
            });
        }

        // Create new manifesto
        const manifesto = await Manifesto.create({
            nominationId: nomination.id,
            phase,
            fileName,
            fileUrl,
            firebasePath: publicId,
            status: 'submitted'
        });

        res.status(201).json({
            success: true,
            message: 'Manifesto uploaded successfully',
            manifesto
        });
    } catch (error) {
        console.error('Upload manifesto error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload manifesto',
            error: error.message
        });
    }
};

// @desc    Get manifesto by nomination and phase
// @route   GET /api/manifestos/:nominationId/:phase
// @access  Public
export const getManifesto = async (req, res) => {
    try {
        const { nominationId, phase } = req.params;

        const manifesto = await Manifesto.findOne({
            where: {
                nominationId,
                phase
            },
            include: [
                {
                    model: Nomination,
                    include: ['candidate']
                }
            ]
        });

        if (!manifesto) {
            return res.status(404).json({
                success: false,
                message: 'Manifesto not found'
            });
        }

        res.status(200).json({
            success: true,
            manifesto
        });
    } catch (error) {
        console.error('Get manifesto error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get manifesto',
            error: error.message
        });
    }
};

// @desc    Get all manifestos for a nomination
// @route   GET /api/manifestos/nomination/:nominationId
// @access  Public
export const getNominationManifestos = async (req, res) => {
    try {
        const { nominationId } = req.params;

        const manifestos = await Manifesto.findAll({
            where: { nominationId },
            order: [['phase', 'ASC']]
        });

        res.status(200).json({
            success: true,
            count: manifestos.length,
            manifestos
        });
    } catch (error) {
        console.error('Get nomination manifestos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get manifestos',
            error: error.message
        });
    }
};

// @desc    Delete manifesto (before deadline)
// @route   DELETE /api/manifestos/:id
// @access  Private (Candidate only)
export const deleteManifesto = async (req, res) => {
    try {
        const { id } = req.params;

        const manifesto = await Manifesto.findByPk(id, {
            include: [Nomination]
        });

        if (!manifesto) {
            return res.status(404).json({
                success: false,
                message: 'Manifesto not found'
            });
        }

        // Check ownership
        if (manifesto.Nomination.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own manifesto'
            });
        }

        // Check if locked
        if (manifesto.status === 'locked') {
            return res.status(403).json({
                success: false,
                message: 'Manifesto is locked and cannot be deleted'
            });
        }

        // Check if deadline is still open
        const isOpen = await getPhaseDeadlineStatus(manifesto.phase);
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: 'Deadline has passed. Cannot delete manifesto.'
            });
        }

        // Delete from Cloudinary
        await deleteFromCloudinary(manifesto.firebasePath);

        // Delete from database
        await manifesto.destroy();

        res.status(200).json({
            success: true,
            message: 'Manifesto deleted successfully'
        });
    } catch (error) {
        console.error('Delete manifesto error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete manifesto',
            error: error.message
        });
    }
};

// @desc    Proxy PDF for inline viewing
// @route   GET /api/manifestos/view/:id
// @access  Public
export const proxyManifestoPdf = async (req, res) => {
    try {
        const { id } = req.params;

        const manifesto = await Manifesto.findByPk(id);

        if (!manifesto) {
            return res.status(404).json({
                success: false,
                message: 'Manifesto not found'
            });
        }

        const fileUrl = manifesto.fileUrl;
        console.log('Proxying PDF for manifesto:', manifesto.id, fileUrl);

        // Fetch the PDF from Cloudinary
        const fetchPdf = (url, redirectCount = 0) => {
            if (redirectCount > 5) {
                if (!res.headersSent) {
                    return res.status(502).json({ success: false, message: 'Too many redirects' });
                }
                return;
            }

            const mod = url.startsWith('https') ? https : http;

            mod.get(url, (response) => {
                // Follow redirects
                if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                    console.log('Redirect to:', response.headers.location);
                    response.destroy();
                    return fetchPdf(response.headers.location, redirectCount + 1);
                }

                if (response.statusCode !== 200) {
                    console.error('Fetch failed:', response.statusCode, response.headers['x-cld-error']);
                    if (!res.headersSent) {
                        return res.status(502).json({
                            success: false,
                            message: `Storage returned status ${response.statusCode}`
                        });
                    }
                    return;
                }

                // Serve PDF inline
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${manifesto.fileName || 'manifesto.pdf'}"`);
                res.setHeader('Cache-Control', 'public, max-age=3600');
                if (response.headers['content-length']) {
                    res.setHeader('Content-Length', response.headers['content-length']);
                }
                response.pipe(res);
            }).on('error', (err) => {
                console.error('Fetch error:', err.message);
                if (!res.headersSent) {
                    res.status(502).json({ success: false, message: 'Failed to fetch PDF' });
                }
            });
        };

        fetchPdf(fileUrl);
    } catch (error) {
        console.error('Proxy PDF error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to serve PDF' });
        }
    }
};
