import { body, param, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
};

// Registration validation
export const validateRegistration = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .custom((value) => {
            if (!value.endsWith('@iitk.ac.in')) {
                throw new Error('Email must be an IITK email (@iitk.ac.in)');
            }
            return true;
        }),
    handleValidationErrors
];

// OTP verification validation
export const validateOTPVerification = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('name')
        .notEmpty()
        .withMessage('Name is required'),
    body('rollNo')
        .notEmpty()
        .withMessage('Roll number is required'),
    body('department')
        .notEmpty()
        .withMessage('Department is required'),
    body('phone')
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be 10 digits'),
    handleValidationErrors
];

// Login validation
export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Nomination validation
export const validateNomination = [
    body('positions')
        .isArray({ min: 1 })
        .withMessage('At least one position must be selected'),
    handleValidationErrors
];

// Supporter request validation
export const validateSupporterRequest = [
    body('candidateId')
        .isUUID()
        .withMessage('Invalid candidate ID'),
    body('role')
        .isIn(['proposer', 'seconder', 'campaigner'])
        .withMessage('Invalid supporter role'),
    handleValidationErrors
];

// UUID param validation
export const validateUUID = [
    param('id')
        .isUUID()
        .withMessage('Invalid ID format'),
    handleValidationErrors
];

// Candidate UUID param validation
export const validateCandidateParam = [
    param('candidateId')
        .isUUID()
        .withMessage('Invalid Candidate ID format'),
    handleValidationErrors
];
