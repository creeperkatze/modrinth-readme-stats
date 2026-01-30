import curseforgeClient from "../services/curseforgeClient.js";
import { apiCache } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { curseforgeKeys, metaKey, PLATFORM } from "../utils/cacheKeys.js";

const API_CACHE_TTL = 3600; // 1 hour

/**
 * Get CurseForge user ID from username by searching for their projects
 * Uses the search API to find projects by the author, then extracts the author ID
 */
async function getUserIdFromUsername(username) {
    try {
        const CURSEFORGE_API_URL = process.env.CURSEFORGE_API_URL || "https://api.curseforge.com";
        const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY;

        const searchUrl = `${CURSEFORGE_API_URL}/v1/mods/search?gameId=432&searchFilter=${encodeURIComponent(username)}&pageSize=50&sortField=2&sortOrder=desc`;

        const headers = {
            "Accept": "application/json",
            "User-Agent": "Modfolio/1.0"
        };

        if (CURSEFORGE_API_KEY) {
            headers["x-api-key"] = CURSEFORGE_API_KEY;
        }

        const response = await fetch(searchUrl, { headers });

        if (!response.ok) {
            throw new Error(`Failed to search: ${response.status}`);
        }

        const json = await response.json();
        const results = json.data || [];

        logger.info(`Curseforge search for "${username}" returned ${results.length} results`);

        const matchingProject = results.find(mod => {
            if (!mod.authors) return false;
            return mod.authors.some(author =>
                author.name?.toLowerCase() === username.toLowerCase() ||
                author.slug?.toLowerCase() === username.toLowerCase()
            );
        });

        if (matchingProject && matchingProject.authors) {
            const matchingAuthor = matchingProject.authors.find(author =>
                author.name?.toLowerCase() === username.toLowerCase() ||
                author.slug?.toLowerCase() === username.toLowerCase()
            );
            if (matchingAuthor && matchingAuthor.id) {
                logger.info(`Found Curseforge user "${username}" with ID: ${matchingAuthor.id}`);
                return String(matchingAuthor.id);
            }
        }

        // Fallback: Check for partial name match
        for (const mod of results) {
            if (mod.authors) {
                for (const author of mod.authors) {
                    if (author.name &&
                        (author.name.toLowerCase() === username.toLowerCase() ||
                         author.name.toLowerCase().replace(/[^a-z0-9]/g, "") === username.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
                        logger.info(`Found Curseforge user "${username}" with ID: ${author.id} (partial match)`);
                        return String(author.id);
                    }
                }
            }
        }

        throw new Error("User not found - the user may not have any public projects on CurseForge, or their username doesn't match project authors");
    } catch (err) {
        logger.warn(`Error looking up Curseforge user "${username}": ${err.message}`);
        throw err;
    }
}

export const getCfUserLookup = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        if (/^\d+$/.test(username)) {
            return res.json({ id: username });
        }

        const cacheKey = curseforgeKeys.userLookup(username);
        const cached = apiCache.getWithMeta(cacheKey);

        if (cached?.value) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            logger.info(`Curseforge user lookup for "${username}": ${cached.value} (cached ${minutesAgo}m ago)`);
            return res.json({ id: cached.value });
        }

        const userId = await getUserIdFromUsername(username);
        apiCache.set(cacheKey, userId);
        logger.info(`Curseforge user lookup for "${username}": ${userId}`);

        res.json({ id: userId });
    } catch (err) {
        logger.warn(`Error looking up Curseforge user "${req.params.username}": ${err.message}`);
        res.status(404).json({ error: "User not found", message: err.message });
    }
};

export const getCfSlugLookup = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ error: "Slug is required" });
        }

        const cacheKey = curseforgeKeys.slugLookup(slug);
        const cached = apiCache.getWithMeta(cacheKey);

        if (cached?.value) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            logger.info(`Curseforge slug lookup for "${slug}": ${cached.value} (cached ${minutesAgo}m ago)`);
            return res.json({ id: cached.value });
        }

        const modId = await curseforgeClient.searchModBySlug(slug);
        apiCache.set(cacheKey, modId);
        logger.info(`Curseforge slug lookup for "${slug}": ${modId}`);

        res.json({ id: modId });
    } catch (err) {
        logger.warn(`Error looking up Curseforge slug "${req.params.slug}": ${err.message}`);
        res.status(404).json({ error: "Project not found", message: err.message });
    }
};

export const getCurseforgeMeta = async (req, res, next) => {
    try {
        const { type, id } = req.params;

        if (type !== "project" && type !== "user") {
            return res.status(400).json({ error: `Invalid type: ${type}. Must be 'project' or 'user'` });
        }

        const cacheKey = metaKey(PLATFORM.CURSEFORGE, type, id);

        const cached = apiCache.getWithMeta(cacheKey);
        const cachedResult = cached?.value;

        if (cachedResult) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            logger.info(`Showing curseforge meta for ${type} "${id}" (cached ${minutesAgo}m ago)`);
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            return res.json(cachedResult);
        }

        let name = id;
        let url = null;

        if (type === "user") {
            // Validate user id is a number
            if (!/^\d+$/.test(String(id))) {
                return res.status(400).json({ error: "Invalid curseforge user id: must be a number" });
            }

            const userResponse = await curseforgeClient.getUser(id);
            const user = userResponse.data;
            name = user?.displayName || id;
            url = `https://www.curseforge.com/members/${id}`;
        } else if (type === "project") {
            // Validate project id is a number
            if (!/^\d+$/.test(String(id))) {
                return res.status(400).json({ error: "Invalid curseforge project id: must be a number" });
            }

            const modResponse = await curseforgeClient.getMod(id);
            const mod = modResponse.data;
            name = mod?.name || id;
            url = mod?.links?.websiteUrl || null;
        }

        const result = { name, url };
        apiCache.set(cacheKey, result);
        logger.info(`Showing curseforge meta for ${type} "${id}"`);

        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.json(result);
    } catch (err) {
        logger.warn(`Error fetching curseforge meta for "${req.params.type}" "${req.params.id}": ${err.message}`);
        next(err);
    }
};
