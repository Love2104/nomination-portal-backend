import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OTP = sequelize.define('OTP', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

// Method to check if OTP is valid
OTP.prototype.isValid = function () {
    return !this.isUsed && new Date() < this.expiresAt;
};

export default OTP;
