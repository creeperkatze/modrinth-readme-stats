import logger from "./logger.js";

const USER_AGENT = process.env.USER_AGENT;

export async function fetchImageAsBase64(url)
{
    if (!url) return null;
    try
    {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT }
        });
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const contentType = response.headers.get("content-type") || "image/png";
        return `data:${contentType};base64,${base64}`;
    } catch (error)
    {
        logger.warn(`Failed to fetch image ${url}: ${error.message}`);
        return null;
    }
}

export async function fetchImagesForProjects(projects)
{
    await Promise.all(
        projects.map(async (project) =>
        {
            if (project.icon_url)
            {
                project.icon_url_base64 = await fetchImageAsBase64(project.icon_url);
            }
        })
    );
}

export async function fetchVersionDatesForProjects(projects, getVersionsFunc)
{
    const allVersionDates = [];

    await Promise.all(
        projects.map(async (project) =>
        {
            try {
                const versions = await getVersionsFunc(project.id || project.slug);
                const versionDates = versions.map(v => v.date_published);
                allVersionDates.push(...versionDates);
                project.versionDates = versionDates;
            } catch {
                project.versionDates = [];
            }
        })
    );

    return allVersionDates;
}
