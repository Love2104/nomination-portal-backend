import prisma from '../prisma/client.js';
import { getPhaseDeadlineStatus } from '../utils/deadlineValidator.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryStorage.js';
import { logActivity } from '../services/activityService.js';
import https from 'https';
import http from 'http';

// Map frontend phase names to Prisma enum
const phaseMap = {
    phase1: 'PHASE1',
    phase2: 'PHASE2',
    final: 'FINAL'
};

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
        const nomination = await prisma.nomination.findUnique({
            where: { userId: req.user.id }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'No nomination found. Please create a nomination first.'
            });
        }

        const prismaPhase = phaseMap[phase];

        // Check if manifesto already exists for this phase
        const existingManifesto = await prisma.manifesto.findUnique({
            where: {
                nominationId_phase: {
                    nominationId: nomination.id,
                    phase: prismaPhase
                }
            }
        });

        // If exists and locked, cannot update
        if (existingManifesto && existingManifesto.status === 'LOCKED') {
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

        // If updating existing manifesto, delete old file from Cloudinary
        if (existingManifesto) {
            await deleteFromCloudinary(existingManifesto.cloudinaryId);

            const updatedManifesto = await prisma.manifesto.update({
                where: { id: existingManifesto.id },
                data: {
                    fileName,
                    fileUrl,
                    cloudinaryId: publicId
                }
            });

            await logActivity({
                userId: req.user.id,
                action: 'MANIFESTO_UPDATED',
                metadata: { manifestoId: updatedManifesto.id, phase }
            });

            return res.status(200).json({
                success: true,
                message: 'Manifesto updated successfully',
                data: updatedManifesto
            });
        }

        // Create new manifesto
        const manifesto = await prisma.manifesto.create({
            data: {
                nominationId: nomination.id,
                phase: prismaPhase,
                fileName,
                fileUrl,
                cloudinaryId: publicId,
                status: 'SUBMITTED'
            }
        });

        await logActivity({
            userId: req.user.id,
            action: 'MANIFESTO_UPLOADED',
            metadata: { manifestoId: manifesto.id, phase }
        });

        res.status(201).json({
            success: true,
            message: 'Manifesto uploaded successfully',
            data: manifesto,
            // alias for existing frontend
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
        const prismaPhase = phaseMap[phase];

        if (!prismaPhase) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phase'
            });
        }

        const manifesto = await prisma.manifesto.findUnique({
            where: {
                nominationId_phase: {
                    nominationId,
                    phase: prismaPhase
                }
            },
            include: {
                nomination: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, rollNo: true, department: true, profilePic: true }
                        }
                    }
                }
            }
        });

        if (!manifesto) {
            return res.status(404).json({
                success: false,
                message: 'Manifesto not found'
            });
        }

        res.status(200).json({
            success: true,
            data: manifesto,
            // alias for existing frontend
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

        const manifestos = await prisma.manifesto.findMany({
            where: { nominationId },
            orderBy: { phase: 'asc' }
        });

        res.status(200).json({
            success: true,
            count: manifestos.length,
            data: manifestos
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

// @desc    Get all manifestos for a candidate (by userId)
// @route   GET /manifesto/:candidateId
// @access  Private (typically candidate, admin, reviewer via JWT)
export const getCandidateManifestos = async (req, res) => {
    try {
        const { candidateId } = req.params;

        const nomination = await prisma.nomination.findUnique({
            where: { userId: candidateId }
        });

        if (!nomination) {
            return res.status(404).json({
                success: false,
                message: 'No nomination found for candidate',
                data: null
            });
        }

        const manifestos = await prisma.manifesto.findMany({
            where: { nominationId: nomination.id },
            orderBy: { phase: 'asc' }
        });

        return res.status(200).json({
            success: true,
            message: 'Candidate manifestos',
            data: {
                nominationId: nomination.id,
                manifestos
            }
        });
    } catch (error) {
        console.error('Get candidate manifestos error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get candidate manifestos',
            data: null
        });
    }
};

// @desc    Delete manifesto (before deadline)
// @route   DELETE /api/manifestos/:id
// @access  Private (Candidate only)
export const deleteManifesto = async (req, res) => {
    try {
        const { id } = req.params;

        const manifesto = await prisma.manifesto.findUnique({
            where: { id },
            include: { nomination: true }
        });

        if (!manifesto) {
            return res.status(404).json({
                success: false,
                message: 'Manifesto not found'
            });
        }

        // Check ownership
        if (manifesto.nomination.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own manifesto'
            });
        }

        // Check if locked
        if (manifesto.status === 'LOCKED') {
            return res.status(403).json({
                success: false,
                message: 'Manifesto is locked and cannot be deleted'
            });
        }

        // Reverse-map phase for deadline check
        const reversePhaseMap = { PHASE1: 'phase1', PHASE2: 'phase2', FINAL: 'final' };
        const frontendPhase = reversePhaseMap[manifesto.phase];

        const isOpen = await getPhaseDeadlineStatus(frontendPhase);
        if (!isOpen) {
            return res.status(403).json({
                success: false,
                message: 'Deadline has passed. Cannot delete manifesto.'
            });
        }

        // Delete from Cloudinary
        await deleteFromCloudinary(manifesto.cloudinaryId);

        // Delete from database
        await prisma.manifesto.delete({ where: { id } });

        await logActivity({
            userId: req.user.id,
            action: 'MANIFESTO_DELETED',
            metadata: { manifestoId: id }
        });

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

        const manifesto = await prisma.manifesto.findUnique({
            where: { id }
        });

        if (!manifesto) {
            return res.status(404).json({
                success: false,
                message: 'Manifesto not found'
            });
        }

        const fileUrl = manifesto.fileUrl;
        console.log('Proxying PDF for manifesto:', manifesto.id, fileUrl);

        // Fetch the PDF from Cloudinary and pipe to response
        const fetchPdf = (url, redirectCount = 0) => {
            if (redirectCount > 5) {
                if (!res.headersSent) {
                    return res.status(502).json({ success: false, message: 'Too many redirects' });
                }
                return;
            }

            const mod = url.startsWith('https') ? https : http;

            mod.get(url, (response) => {
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
