import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';

// Verify JWT token middleware
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization denied.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Authorization denied.'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Authorization denied.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Transform roles to uppercase to match Enum
        const allowedRoles = roles.map(role => role.toUpperCase());
        const userRole = req.user.role.toUpperCase();

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

// Check if user is candidate
export const isCandidate = async (req, res, next) => {
    if (req.user.role !== 'CANDIDATE') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only candidates can perform this action.'
        });
    }
    next();
};

// Check if user is superadmin
export const isSuperadmin = async (req, res, next) => {
    if (req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Superadmin privileges required.'
        });
    }
    next();
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Check if user is admin or superadmin
export const isAdminOrSuperadmin = async (req, res, next) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Superadmin privileges required.'
        });
    }
    next();
};

// Generate JWT token
export const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};
