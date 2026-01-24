import dotenv from "dotenv";
import { performance } from "perf_hooks";
import { fetchImageAsBase64 } from "../utils/imageFetcher.js";

dotenv.config({ quiet: true });

import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

const CURSEFORGE_API_URL = process.env.CURSEFORGE_API_URL || "https://api.curseforge.com";
const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY;

// Known loader names (for detecting loaders in gameVersions array)
const KNOWN_LOADERS = ["Forge", "Fabric", "NeoForge", "Quilt", "Rift", "LiteLoader", "Cauldron", "ModLoader", "Canvas", "Iris", "OptiFine", "Sodium"];

// CurseForge gameVersionTypeId to loader name mapping (for extracting loaders from sortableGameVersions)
// These are type IDs that represent mod loaders rather than game versions
const GAME_VERSION_TYPE_IDS = {
    68441: "NeoForge",
    // Add more as discovered - Forge and Fabric type IDs are unknown
};

// CurseForge ModLoaderType enum to loader name mapping (legacy, for direct modLoader field if it exists)
const MOD_LOADER_TYPES = {
    1: "Forge",
    2: "Cauldron",
    3: "LiteLoader",
    4: "Fabric",
    5: "Quilt",
    6: "NeoForge",
    // Additional loader types that may appear
    7: "Rift",
    8: "ModLoader"
};

// Default number of files to display
const DEFAULT_FILES_COUNT = 5;

export class CurseforgeClient
{
    async fetch(url)
    {
        const headers = {
            "User-Agent": `creeperkatze/modrinth-embeds/${VERSION}`
        };

        if (CURSEFORGE_API_KEY) {
            headers["x-api-key"] = CURSEFORGE_API_KEY;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Resource not found");
            }

            const errorBody = await response.text().catch(() => "");
            let errorText = errorBody;

            try {
                const json = JSON.parse(errorBody);
                errorText = json.error || json.message || json.description || errorBody;
            } catch { }

            throw new Error(`CurseForge API error: ${response.status}: ${errorText}`);
        }

        return response.json();
    }

    async getMod(modId)
    {
        return this.fetch(`${CURSEFORGE_API_URL}/v1/mods/${modId}`);
    }

    async getModFiles(modId)
    {
        return this.fetch(`${CURSEFORGE_API_URL}/v1/mods/${modId}/files`);
    }

    /**
     * Get stats for a CurseForge mod (for card generation)
     * @param {number|string} modId - The mod ID
     * @param {number} maxFiles - Maximum files to fetch
     * @param {boolean} convertToPng - Whether to convert images to PNG
     */
    async getModStats(modId, maxFiles = DEFAULT_FILES_COUNT, convertToPng = false)
    {
        const apiStart = performance.now();

        const modResponse = await this.getMod(modId);
        const mod = modResponse.data;

        let imageConversionTime = 0;

        // Fetch mod logo if available
        if (mod?.logo?.url) {
            const result = await fetchImageAsBase64(mod.logo.url, convertToPng);
            mod.logo_url_base64 = result?.data;
            if (result?.conversionTime) imageConversionTime += result.conversionTime;
        }

        // Fetch files for the mod
        let files = [];
        try {
            const filesResponse = await this.getModFiles(modId);
            const allFiles = filesResponse.data || [];

            // Sort by date (newest first) and take maxFiles
            files = allFiles
                .sort((a, b) => new Date(b.fileDate) - new Date(a.fileDate))
                .slice(0, maxFiles)
                .map(file => {
                    // Extract loaders from sortableGameVersions based on gameVersionTypeId
                    const loadersFromTypeId = (file.sortableGameVersions || [])
                        .map(v => GAME_VERSION_TYPE_IDS[v.gameVersionTypeId])
                        .filter(Boolean);

                    // Also extract loaders from gameVersions array by matching known loader names
                    const loadersFromGameVersions = (file.gameVersions || [])
                        .filter(v => KNOWN_LOADERS.includes(v));

                    // Combine and deduplicate
                    const loaders = [...new Set([...loadersFromTypeId, ...loadersFromGameVersions])];

                    return {
                        displayName: file.displayName || file.fileName,
                        fileName: file.fileName,
                        fileDate: file.fileDate,
                        releaseType: file.releaseType, // 1=Release, 2=Beta, 3=Alpha
                        downloadCount: file.downloadCount || 0,
                        gameVersions: file.gameVersions || [],
                        sortableGameVersions: file.sortableGameVersions || [],
                        modLoaders: loaders
                    };
                });
        } catch {
            // If files fetch fails, continue with empty files array
            files = [];
        }

        const apiTime = performance.now() - apiStart;

        return {
            mod,
            files,
            stats: {
                downloads: mod?.downloadCount || 0,
                likes: mod?.thumbsUpCount || 0,
                versionCount: files.length
            },
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    /**
     * Get badge stats for a CurseForge mod (lightweight, no files)
     * @param {number|string} modId - The mod ID
     * @param {boolean} fetchFiles - Whether to fetch files for version count
     */
    async getModBadgeStats(modId, fetchFiles = false)
    {
        const apiStart = performance.now();

        const modResponse = await this.getMod(modId);
        const mod = modResponse.data;

        let apiTime = performance.now() - apiStart;

        const stats = {
            downloads: mod?.downloadCount || 0,
            likes: mod?.thumbsUpCount || 0,
            versionCount: 0
        };

        // Only fetch files if specifically requested (for version count badge)
        if (fetchFiles) {
            try {
                const filesResponse = await this.getModFiles(modId);
                stats.versionCount = filesResponse.data?.length || 0;
            } catch {
                stats.versionCount = 0;
            }
            apiTime = performance.now() - apiStart;
        }

        return { stats, timings: { api: apiTime } };
    }

    /**
     * Search for a mod by slug and return its ID
     * @param {string} slug - The project slug
     * @returns {Promise<number>} The project ID
     */
    async searchModBySlug(slug)
    {
        // CurseForge search API
        const searchUrl = `${CURSEFORGE_API_URL}/v1/mods/search?gameId=432&slug=${encodeURIComponent(slug)}`;

        const response = await this.fetch(searchUrl);
        const data = response.data;

        if (!data || data.length === 0) {
            throw new Error(`Mod not found: ${slug}`);
        }

        return data[0].id;
    }

    /**
     * Check if API key is configured
     */
    isConfigured()
    {
        return !!CURSEFORGE_API_KEY;
    }
}

export default new CurseforgeClient();
