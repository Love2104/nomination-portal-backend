import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Nomination = sequelize.define('Nomination', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    positions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('draft', 'submitted', 'locked', 'verified', 'rejected'),
        defaultValue: 'draft'
    },
    proposerCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    seconderCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    campaignerCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true
});

// Define association
Nomination.belongsTo(User, { foreignKey: 'userId', as: 'candidate' });
User.hasOne(Nomination, { foreignKey: 'userId' });

export default Nomination;
