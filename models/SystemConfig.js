import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SystemConfig = sequelize.define('SystemConfig', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Nomination deadlines
    nominationStartDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    nominationEndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Proposer/Seconder deadlines
    proposerSeconderStartDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    proposerSeconderEndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Campaigner deadlines
    campaignerStartDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    campaignerEndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Manifesto Phase 1 deadlines
    manifestoPhase1StartDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    manifestoPhase1EndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Manifesto Phase 2 deadlines
    manifestoPhase2StartDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    manifestoPhase2EndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Final Manifesto deadlines
    manifestoFinalStartDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    manifestoFinalEndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Supporter limits
    maxProposers: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    maxSeconders: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    maxCampaigners: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    // Reviewer credentials (stored as JSON)
    phase1ReviewerCredentials: {
        type: DataTypes.JSONB,
        defaultValue: {
            username: 'phase1_reviewer',
            password: 'change_me_phase1'
        }
    },
    phase2ReviewerCredentials: {
        type: DataTypes.JSONB,
        defaultValue: {
            username: 'phase2_reviewer',
            password: 'change_me_phase2'
        }
    },
    finalReviewerCredentials: {
        type: DataTypes.JSONB,
        defaultValue: {
            username: 'final_reviewer',
            password: 'change_me_final'
        }
    }
}, {
    timestamps: true
});

export default SystemConfig;
