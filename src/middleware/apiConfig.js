import logger from "../utils/logger.js";

/**
 * Creates middleware that checks if a platform's API client is properly configured.
 * This eliminates repeated API key checks in controller functions.
 *
 * @param {string} platformName - Display name of the platform (e.g., "CurseForge")
 * @param {Object} client - The API client to check
 * @param {string} envVarName - Name of the required environment variable
 * @returns {import('express').RequestHandler} Express middleware function
 */
export const requireApiKey = (platformName, client, envVarName) => {
    return (req, res, next) => {
        if (!client.isConfigured()) {
            logger.warn(`${platformName} API key not configured`);
            return res.status(500).json({
                error: `${platformName} API key not configured`,
                message: `Set ${envVarName} environment variable`
            });
        }
        next();
    };
};
