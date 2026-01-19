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

const TOP_PROJECTS_COUNT = 5;

export function generateCollectionCard(data, theme = "dark")
{
    const { collection, stats } = data;
    const colors = getThemeColors(theme);

    const topProjects = stats.topProjects.slice(0, TOP_PROJECTS_COUNT);
    const hasProjects = topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 120;

    const statsData = [
        { x: 15, label: "Total Downloads", value: formatNumber(stats.totalDownloads) },
        { x: 155, label: "Followers", value: formatNumber(stats.totalFollowers) },
        { x: 270, label: "Projects", value: stats.projectCount }
    ];

    const content = `
${generateActivitySparkline(stats.allVersionDates || [], colors)}
${generateHeader("collection", "collection", collection.name, colors)}
${generateProfileImage(collection.icon_url_base64 || collection.icon_url, "collection-clip", 400, 60, 35, colors)}
${generateStatsGrid(statsData, colors)}
${hasProjects ? generateProjectList(topProjects, "Projects", colors) : ""}
${generateAttribution(height, colors)}`;

    return generateSvgWrapper(450, height, colors, content);
}
