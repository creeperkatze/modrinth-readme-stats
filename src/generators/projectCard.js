import { formatNumber } from "../utils/formatters.js";
import { getProjectTypeIcon } from "../constants/loaderConfig.js";
import { ICONS } from "../constants/icons.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateRectImage,
    generateStatsGrid,
    generateVersionList,
    generateAttribution
} from "./svgComponents.js";

export function generateProjectCard(data, theme = "dark")
{
    const { project, versions, stats } = data;
    const colors = getThemeColors(theme);

    const projectTypeIconName = getProjectTypeIcon(project.project_type);
    const latestVersions = versions.slice(0, 5);
    const hasVersions = latestVersions.length > 0;
    const height = hasVersions ? 150 + (latestVersions.length * 50) : 110;

    const versionDates = versions.map(v => v.date_published);

    const statsData = [
        { x: 15, label: "Downloads", value: formatNumber(stats.downloads) },
        { x: 155, label: "Followers", value: formatNumber(stats.followers) },
        { x: 270, label: "Versions", value: stats.versionCount }
    ];

    const content = `
${generateActivitySparkline(versionDates, colors)}

  <!-- Modrinth Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="0 0 512 514">
    ${ICONS.modrinth(colors.accentColor)}
  </svg>

  <!-- Chevron -->
  <svg x="41" y="15" width="16" height="24" viewBox="0 0 24 24">
    ${ICONS.chevronRight(colors.textColor)}
  </svg>

  <!-- Project Type Icon -->
  <svg x="58" y="15" width="24" height="24" viewBox="0 0 24 24">
    ${ICONS[projectTypeIconName](colors.textColor)}
  </svg>

  <!-- Title -->
  <text x="87" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${colors.textColor}">
    ${project.title.length > 22 ? project.title.substring(0, 22) + "..." : project.title}
  </text>

${generateRectImage(project.icon_url_base64 || project.icon_url, "project-image-clip", 365, 25, 70, 70, 14, colors)}
${generateStatsGrid(statsData, colors)}
${hasVersions ? generateVersionList(latestVersions, colors) : ""}
${generateAttribution(height, colors)}`;

    return generateSvgWrapper(450, height, colors, content);
}
