import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

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
    ],
    hooks: {
        beforeCreate: async (otp) => {
            if (otp.otp) {
                const salt = await bcrypt.genSalt(10);
                otp.otp = await bcrypt.hash(otp.otp, salt);
            }
        }
    }
});

// Method to verify OTP
OTP.prototype.verifyOTP = async function (enteredOtp) {
    if (this.isUsed) return false;
    if (new Date() > this.expiresAt) return false;
    return await bcrypt.compare(enteredOtp, this.otp);
};

export default OTP;
