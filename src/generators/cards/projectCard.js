import { formatNumber } from "../../utils/formatters.js";
import { getProjectTypeIcon } from "../../constants/loaderConfig.js";
import { getStatConfigs, getEntityIcon } from "../../constants/platformConfig.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateHeader,
    generateRectImage,
    generateStatsGrid,
    generateDivider,
    generateVersionList,
    generateInfo,
    generateAttribution
} from "../../utils/svgComponents.js";

const DEFAULT_VERSIONS_COUNT = 5;

export function generateProjectCard(data, options, platformConfig, entityType = "project")
{
    const { project, versions, stats } = data;
    const {
        showVersions = true,
        maxVersions = DEFAULT_VERSIONS_COUNT,
        showSparklines = true,
        color = null,
        backgroundColor = null,
        fromCache = false,
        relativeTime = false
    } = options;

    // Use platform default color if no custom color specified
    const accentColor = color || platformConfig.defaultColor;
    const colors = getThemeColors(accentColor, backgroundColor);
    colors.accentColor = accentColor; // Ensure platform color is used

    // Normalize version data - ensure all versions have expected field names
    const latestVersions = showVersions ? versions.slice(0, maxVersions).map(v => ({
        ...v,
        version_number: v.version_number || v.name || v.version || "Unknown",
        date_published: v.date_published || v.releasedAt || v.createdAt || v.fileDate || new Date().toISOString(),
        // Map Hangar platforms to loaders, and gameVersions to game_versions
        loaders: v.loaders || v.platforms || [],
        game_versions: v.game_versions || v.gameVersions || []
    })) : [];
    const hasVersions = showVersions && latestVersions.length > 0;
    const height = hasVersions ? 150 + (latestVersions.length * 50) : 130;

    const versionDates = versions.map(v => v[platformConfig.terminology.versionField]);

    // Get stat configs from platform config
    const statConfigs = getStatConfigs(platformConfig.id, entityType);
    const statsData = statConfigs ? statConfigs.map((config, index) => {
        const xPositions = [15, 155, 270];
        const value = stats[config.field];
        // Handle rank which may be null
        const displayValue = value == null ? "N/A" : formatNumber(value);
        return { x: xPositions[index], label: config.label, value: displayValue };
    }) : [];

    // Get project type icon - for CurseForge, we need special handling
    let projectTypeIconName = getEntityIcon(entityType);
    if (platformConfig.id === "modrinth" && project.project_type) {
        projectTypeIconName = getProjectTypeIcon(project.project_type);
    } else if (platformConfig.id === "curseforge" && project.classId) {
        // CurseForge class ID to icon mapping
        const classIconMap = {
            5: "plug", // Plugins
            6: "box", // Mods
            12: "paintbrush", // Resource Packs
            17: "earth", // Worlds
            4471: "package-open", // Modpacks
            4546: "glasses", // Shaders
            6552: "glasses", // Iris Shaders
            6768: "glasses", // Shaders
            6945: "datapack", // Datapacks
            84203: "optifine", // OptiFine
            84200: "canvas", // Canvas
        };
        projectTypeIconName = classIconMap[project.classId] || "box";
    }

    // Get title field name per platform
    const title = project.title || project.name || "Unknown";

    const content = `
${showSparklines ? generateActivitySparkline(versionDates, colors) : ""}
${generateHeader(entityType, projectTypeIconName, title, colors, platformConfig.icon(colors.accentColor), platformConfig.iconViewBox)}
${generateRectImage(
        project.icon_url_base64 || null,
        "project-image-clip",
        365,
        25,
        70,
        70,
        14,
        colors
    )}
${generateStatsGrid(statsData, colors)}
${generateDivider(colors)}
${generateVersionList(latestVersions, colors, relativeTime, platformConfig.labels.sections.latestVersions)}
${generateInfo(height, colors, fromCache)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}
