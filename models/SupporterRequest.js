import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Nomination from './Nomination.js';

const SupporterRequest = sequelize.define('SupporterRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    candidateId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    nominationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Nomination,
            key: 'id'
        }
    },
    role: {
        type: DataTypes.ENUM('proposer', 'seconder', 'campaigner'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending'
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'nominationId', 'role']
        }
    ]
});

// Define associations
SupporterRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
SupporterRequest.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
SupporterRequest.belongsTo(Nomination, { foreignKey: 'nominationId' });

Nomination.hasMany(SupporterRequest, { foreignKey: 'nominationId' });

export default SupporterRequest;
