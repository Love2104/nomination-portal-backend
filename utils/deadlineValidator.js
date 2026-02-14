import { SystemConfig } from '../models/index.js';

// Get system configuration (create if doesn't exist)
export const getSystemConfig = async () => {
    let config = await SystemConfig.findOne();

    if (!config) {
        config = await SystemConfig.create({});
    }

    return config;
};

// Check if current time is within deadline
const isWithinDeadline = (startDate, endDate) => {
    if (!startDate || !endDate) return false;

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return now >= start && now <= end;
};

// Nomination deadline validator
export const isNominationOpen = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.nominationStartDate, config.nominationEndDate);
};

// Proposer/Seconder deadline validator
export const isProposerSeconderOpen = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.proposerSeconderStartDate, config.proposerSeconderEndDate);
};

// Campaigner deadline validator
export const isCampaignerOpen = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.campaignerStartDate, config.campaignerEndDate);
};

// Manifesto Phase 1 deadline validator
export const isManifestoPhase1Open = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.manifestoPhase1StartDate, config.manifestoPhase1EndDate);
};

// Manifesto Phase 2 deadline validator
export const isManifestoPhase2Open = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.manifestoPhase2StartDate, config.manifestoPhase2EndDate);
};

// Final Manifesto deadline validator
export const isManifestoFinalOpen = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.manifestoFinalStartDate, config.manifestoFinalEndDate);
};

// Get phase deadline status
export const getPhaseDeadlineStatus = async (phase) => {
    switch (phase) {
        case 'phase1':
            return await isManifestoPhase1Open();
        case 'phase2':
            return await isManifestoPhase2Open();
        case 'final':
            return await isManifestoFinalOpen();
        default:
            return false;
    }
};

// Check if supporter role deadline is open
export const isSupporterRoleOpen = async (role) => {
    if (role === 'proposer' || role === 'seconder') {
        return await isProposerSeconderOpen();
    } else if (role === 'campaigner') {
        return await isCampaignerOpen();
    }
    return false;
};
