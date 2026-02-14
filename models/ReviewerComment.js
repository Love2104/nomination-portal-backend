import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Manifesto from './Manifesto.js';

const ReviewerComment = sequelize.define('ReviewerComment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    manifestoId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Manifesto,
            key: 'id'
        }
    },
    reviewerId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reviewerName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: true
});

// Define association
ReviewerComment.belongsTo(Manifesto, { foreignKey: 'manifestoId' });
Manifesto.hasMany(ReviewerComment, { foreignKey: 'manifestoId' });

export default ReviewerComment;
