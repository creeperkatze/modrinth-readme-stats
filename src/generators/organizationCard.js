import { formatNumber } from "../utils/formatters.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateHeader,
    generateProfileImage,
    generateStatsGrid,
    generateProjectList,
    generateAttribution
} from "./svgComponents.js";

export function generateOrganizationCard(data, theme = "dark")
{
    const { organization, stats } = data;
    const colors = getThemeColors(theme);

    const topProjects = stats.topProjects.slice(0, 5);
    const hasProjects = topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 120;

    const statsData = [
        { x: 15, label: "Total Downloads", value: formatNumber(stats.totalDownloads) },
        { x: 155, label: "Followers", value: formatNumber(stats.totalFollowers) },
        { x: 270, label: "Projects", value: stats.projectCount }
    ];

    const content = `
${generateActivitySparkline(stats.allVersionDates || [], colors)}
${generateHeader("organization", "building", organization.name, colors)}
${generateProfileImage(organization.icon_url_base64 || organization.icon_url, "org-clip", 400, 60, 35, colors)}
${generateStatsGrid(statsData, colors)}
${hasProjects ? generateProjectList(topProjects, "Top Projects", colors) : ""}
${generateAttribution(height, colors)}`;

    return generateSvgWrapper(450, height, colors, content);
}
