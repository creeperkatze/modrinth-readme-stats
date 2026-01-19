import modrinthClient from "../services/modrinthClient.js";
import cache from "../utils/cache.js";
import { generateUserCard } from "../generators/userCard.js";
import { generateProjectCard } from "../generators/projectCard.js";
import { generateOrganizationCard } from "../generators/organizationCard.js";
import { generateCollectionCard } from "../generators/collectionCard.js";
import logger from "../utils/logger.js";

const MAX_AGE = Math.floor(cache.ttl / 1000);

const CARD_CONFIGS = {
    user: {
        paramKey: "username",
        dataFetcher: (client, id) => client.getUserStats(id),
        generator: generateUserCard
    },
    project: {
        paramKey: "slug",
        dataFetcher: (client, id) => client.getProjectStats(id),
        generator: generateProjectCard
    },
    organization: {
        paramKey: "id",
        dataFetcher: (client, id) => client.getOrganizationStats(id),
        generator: generateOrganizationCard
    },
    collection: {
        paramKey: "id",
        dataFetcher: (client, id) => client.getCollectionStats(id),
        generator: generateCollectionCard
    }
};

const handleCardRequest = async (req, res, next, cardType) => {
    try {
        const config = CARD_CONFIGS[cardType];
        const identifier = req.params[config.paramKey];
        const theme = req.query.theme || "dark";
        const cacheKey = `${cardType}:${identifier}:${theme}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing ${cardType} card for "${identifier}" (cached)`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(cached);
        }

        const data = await config.dataFetcher(modrinthClient, identifier);
        const svg = config.generator(data, theme);

        cache.set(cacheKey, svg);
        logger.info(`Showing ${cardType} card for "${identifier}"`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
        res.send(svg);
    } catch (err) {
        const config = CARD_CONFIGS[cardType];
        const identifier = req.params[config.paramKey];
        logger.warn(`Error showing ${cardType} card for "${identifier}": ${err.message}`);
        next(err);
    }
};

export const getUser = (req, res, next) => handleCardRequest(req, res, next, "user");
export const getProject = (req, res, next) => handleCardRequest(req, res, next, "project");
export const getOrganization = (req, res, next) => handleCardRequest(req, res, next, "organization");
export const getCollection = (req, res, next) => handleCardRequest(req, res, next, "collection");
