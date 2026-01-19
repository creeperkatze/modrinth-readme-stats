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

export function generateUserCard(data, theme = "dark")
{
    const { user, stats } = data;
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
${generateHeader("user", "user", user.username, colors)}
${generateProfileImage(user.avatar_url_base64 || user.avatar_url, "profile-clip", 400, 60, 35, colors)}
${generateStatsGrid(statsData, colors)}
${hasProjects ? generateProjectList(topProjects, "Top Projects", colors) : ""}
${generateAttribution(height, colors)}`;

    return generateSvgWrapper(450, height, colors, content);
}
