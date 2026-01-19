export function aggregateProjectStats(projects)
{
    const totalDownloads = projects.reduce((sum, project) => sum + (project.downloads || 0), 0);
    const totalFollowers = projects.reduce((sum, project) => sum + (project.followers || 0), 0);
    const projectCount = projects.length;

    const mostPopular = projects.reduce((max, project) =>
        (project.downloads || 0) > (max.downloads || 0) ? project : max
    , projects[0] || null);

    const topProjects = [...projects]
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, 5);

    const avgDownloads = projectCount > 0 ? Math.floor(totalDownloads / projectCount) : 0;
    const engagementRatio = totalDownloads > 0 ? (totalFollowers / totalDownloads * 1000).toFixed(1) : 0;

    return {
        totalDownloads,
        totalFollowers,
        projectCount,
        mostPopular,
        topProjects,
        avgDownloads,
        engagementRatio
    };
}

export function aggregateProjectTypes(projects)
{
    return projects.reduce((acc, project) =>
    {
        const types = Array.isArray(project.project_types)
            ? project.project_types
            : [project.project_type || "mod"];

        types.forEach(type =>
        {
            acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
    }, {});
}

export function aggregateGameVersions(projects, limit = 3)
{
    const gameVersions = {};
    projects.forEach(project =>
    {
        if (project.game_versions && Array.isArray(project.game_versions))
        {
            project.game_versions.forEach(version =>
            {
                gameVersions[version] = (gameVersions[version] || 0) + 1;
            });
        }
    });

    return Object.entries(gameVersions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([version]) => version);
}

export function aggregateLoaders(projects)
{
    const loaders = {};
    projects.forEach(project =>
    {
        if (project.loaders && Array.isArray(project.loaders))
        {
            project.loaders.forEach(loader =>
            {
                loaders[loader] = (loaders[loader] || 0) + 1;
            });
        }
    });
    return loaders;
}

export function aggregateCategories(projects, limit = 3)
{
    const categories = {};
    projects.forEach(project =>
    {
        if (project.categories && Array.isArray(project.categories))
        {
            project.categories.forEach(category =>
            {
                categories[category] = (categories[category] || 0) + 1;
            });
        }
    });

    return Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([category]) => category);
}

export function findRecentProject(projects)
{
    return projects
        .filter(p => p.published)
        .sort((a, b) => new Date(b.published) - new Date(a.published))[0];
}

export function normalizeV3ProjectFields(projects)
{
    return projects.map(project => ({
        ...project,
        title: project.name || project.title,
        project_type: Array.isArray(project.project_types)
            ? project.project_types[0]
            : (project.project_type || "mod")
    }));
}
