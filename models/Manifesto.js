import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Nomination from './Nomination.js';

const Manifesto = sequelize.define('Manifesto', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nominationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Nomination,
            key: 'id'
        }
    },
    phase: {
        type: DataTypes.ENUM('phase1', 'phase2', 'final'),
        allowNull: false
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firebasePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('draft', 'submitted', 'locked'),
        defaultValue: 'submitted'
    },
    uploadedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['nominationId', 'phase']
        }
    ]
});

// Define association
Manifesto.belongsTo(Nomination, { foreignKey: 'nominationId' });
Nomination.hasMany(Manifesto, { foreignKey: 'nominationId' });

export default Manifesto;
