import prisma from '../prisma/client.js';

// Get system config (single-row model)
export const getSystemConfig = async () => {
    let config = await prisma.systemConfig.findFirst();
    if (!config) {
        config = await prisma.systemConfig.create({ data: {} });
    }
    return config;
};

// Check if current time is within deadline
const isWithinDeadline = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const now = new Date();
    return now >= new Date(startDate) && now <= new Date(endDate);
};

// Nomination deadline validator (same window as Proposer/Seconder)
export const isNominationOpen = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.nominationStart, config.nominationEnd);
};

// Proposer/Seconder deadline validator (same as nomination)
export const isProposerSeconderOpen = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.nominationStart, config.nominationEnd);
};

// Campaigner deadline validator (different window)
export const isCampaignerOpen = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.campaignerStart, config.campaignerEnd);
};

// Manifesto Phase 1 deadline validator
export const isManifestoPhase1Open = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.manifestoPhase1Start, config.manifestoPhase1End);
};

// Manifesto Phase 2 deadline validator
export const isManifestoPhase2Open = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.manifestoPhase2Start, config.manifestoPhase2End);
};

// Final Manifesto deadline validator
export const isManifestoFinalOpen = async () => {
    const config = await getSystemConfig();
    return isWithinDeadline(config.manifestoFinalStart, config.manifestoFinalEnd);
};

// Get phase deadline status for frontend/checks
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
