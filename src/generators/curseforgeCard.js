import { formatNumber, escapeXml, truncateText } from "../utils/formatters.js";
import { ICONS } from "../constants/icons.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateRectImage,
    generateStatsGrid,
    generateDivider,
    generateVersionList,
    generateAttribution,
    generateInfo
} from "./svgComponents.js";

const DEFAULT_FILE_COUNT = 5;

// CurseForge logo SVG path (viewBox 0 0 32 32)
const CURSEFORGE_LOGO = (color) => `
<path fill="${color}" d="M23.9074 12.0181C23.9074 12.0181 30.0327 11.0522 31 8.23523H21.6168V6H1L3.53975 8.94699V11.9664C3.53975 11.9664 9.94812 11.6332 12.427 13.5129C15.8202 16.6579 8.61065 20.9092 8.61065 20.9092L7.37439 25C9.30758 23.1593 12.9921 20.7781 19.7474 20.8929C17.1767 21.7053 14.5917 22.9743 12.5794 25H26.2354L24.9494 20.9092C24.9494 20.9092 15.0519 15.0732 23.9074 12.0184V12.0181Z"/>
`;

/**
 * Get project type icon from CurseForge class ID
 */
function getProjectTypeIconFromClassId(classId)
{
    // CurseForge class IDs (for Minecraft)
    // https://docs.curseforge.com/#toc_Schemas-ProjectClass
    const classIconMap = {
        5: "plug", // Plugins (Bukkit, Spigot, etc.)
        6: "box", // Mods
        12: "paintbrush", // Resource Packs
        17: "earth", // Worlds
        4471: "package-open", // Modpacks
        4546: "glasses", // Shaders category
        6552: "glasses", // Iris Shaders mod
        6768: "glasses", // Shaders (various shader mods)
        6945: "datapack", // Datapacks
        84203: "optifine", // OptiFine
        84200: "canvas", // Canvas Renderer
    };
    return classIconMap[classId] || "box";
}

/**
 * Generate a CurseForge mod card
 */
export function generateCurseforgeCard(data, options = {})
{
    const { mod, files, stats } = data;
    const {
        showVersions = true,
        maxVersions = DEFAULT_FILE_COUNT,
        showSparklines = true,
        color = null,
        backgroundColor = null,
        fromCache = false,
        relativeTime = false
    } = options;

    // Use CurseForge orange (#F16436) as default if no custom color specified
    // We need to check if color is null/undefined and use the CF default
    const accentColor = color || "#F16436";
    const colors = getThemeColors(accentColor, backgroundColor);

    // Override accent color to ensure CurseForge orange is used
    colors.accentColor = accentColor;

    // Map CurseForge files to Modrinth version format
    const versions = showVersions ? files.slice(0, maxVersions).map(file => ({
        version_number: file.displayName,
        date_published: file.fileDate,
        loaders: file.modLoaders || [],
        game_versions: file.gameVersions || [],
        downloads: file.downloadCount || 0
    })) : [];

    // Extract all file dates for sparkline (not just displayed versions)
    const allFileDates = files.map(file => file.fileDate);

    const hasVersions = showVersions && versions.length > 0;
    const height = hasVersions ? 150 + (versions.length * 50) : 130;

    // Get project type icon from class ID
    const projectTypeIconName = getProjectTypeIconFromClassId(mod.classId);
    const projectTypeIcon = ICONS[projectTypeIconName] || ICONS.box;

    const statsData = [
        { x: 15, label: "Downloads", value: formatNumber(stats.downloads) },
        { x: 155, label: "Rank", value: stats.rank ? stats.rank : "N/A" },
        { x: 270, label: "Files", value: stats.fileCount }
    ];

    const content = `
${showSparklines ? generateActivitySparkline(allFileDates, colors) : ""}
${generateRectImage(
        mod.logo_url_base64 || null,
        "mod-image-clip",
        365,
        25,
        70,
        70,
        14,
        colors
    )}

  <!-- CurseForge Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="0 0 32 32">
    ${CURSEFORGE_LOGO(colors.accentColor)}
  </svg>

  <!-- Chevron -->
  <svg x="41" y="15" width="16" height="24" viewBox="0 0 24 24">
    ${ICONS.chevronRight(colors.textColor)}
  </svg>

  <!-- Project Type Icon -->
  <svg x="58" y="15" width="24" height="24" viewBox="0 0 24 24">
    ${projectTypeIcon(colors.textColor)}
  </svg>

  <!-- Title -->
  <text x="87" y="35" font-family="Inter, sans-serif"
      font-size="20" font-weight="bold" fill="${colors.textColor}">
    ${escapeXml(truncateText(mod.name || "Unknown Mod", 22))}
  </text>

${generateStatsGrid(statsData, colors)}
${generateDivider(colors)}
${generateVersionList(versions, colors, relativeTime, "Latest Files")}
${generateInfo(height, colors, fromCache)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}
