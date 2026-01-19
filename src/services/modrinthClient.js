import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { fetchImageAsBase64, fetchImagesForProjects, fetchVersionDatesForProjects } from "../utils/imageFetcher.js";
import {
    aggregateProjectStats,
    aggregateProjectTypes,
    aggregateGameVersions,
    aggregateLoaders,
    aggregateCategories,
    findRecentProject,
    normalizeV3ProjectFields
} from "../utils/statsAggregator.js";

dotenv.config({ quiet: true });

const MODRINTH_API_URL = process.env.MODRINTH_API_URL;
const MODRINTH_API_V3_URL = process.env.MODRINTH_API_V3_URL;
const USER_AGENT = process.env.USER_AGENT;

export class ModrinthClient
{
    async fetch(url)
    {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT }
        });

        if (!response.ok)
        {
            if (response.status === 404)
            {
                throw new Error("Resource not found");
            }

            const errorBody = await response.text().catch(() => "");
            let errorText = errorBody;

            try
            {
                const json = JSON.parse(errorBody);
                errorText = json.error || json.message || json.description || errorBody;
            } catch { }

            logger.warn(`API error ${response.status}: ${url}`);
            throw new Error(`Modrinth API error: ${response.status}|${errorText}`);
        }

        return response.json();
    }

    async getUser(username)
    {
        return this.fetch(`${MODRINTH_API_URL}/user/${username}`);
    }

    async getUserProjects(username)
    {
        return this.fetch(`${MODRINTH_API_URL}/user/${username}/projects`);
    }

    async getProject(slug)
    {
        return this.fetch(`${MODRINTH_API_URL}/project/${slug}`);
    }

    async getProjectVersions(slug)
    {
        return this.fetch(`${MODRINTH_API_URL}/project/${slug}/version?include_changelog=false`);
    }

    async getOrganization(id)
    {
        return this.fetch(`${MODRINTH_API_V3_URL}/organization/${id}`);
    }

    async getOrganizationProjects(id)
    {
        return this.fetch(`${MODRINTH_API_V3_URL}/organization/${id}/projects`);
    }

    async getCollection(id)
    {
        return this.fetch(`${MODRINTH_API_V3_URL}/collection/${id}`);
    }

    async getProjects(ids)
    {
        const idsParam = JSON.stringify(ids);
        return this.fetch(`${MODRINTH_API_URL}/projects?ids=${encodeURIComponent(idsParam)}`);
    }

    async getUserStats(username)
    {
        const [user, projects] = await Promise.all([
            this.getUser(username),
            this.getUserProjects(username)
        ]);

        const allVersionDates = await fetchVersionDatesForProjects(projects, this.getProjectVersions.bind(this));

        if (user.avatar_url)
        {
            user.avatar_url_base64 = await fetchImageAsBase64(user.avatar_url);
        }

        await fetchImagesForProjects(projects);

        const stats = aggregateProjectStats(projects);

        return {
            user,
            projects,
            stats: {
                ...stats,
                projectTypes: aggregateProjectTypes(projects),
                topGameVersions: aggregateGameVersions(projects),
                loaders: aggregateLoaders(projects),
                topCategories: aggregateCategories(projects),
                recentProject: findRecentProject(projects),
                allVersionDates
            }
        };
    }

    async getProjectStats(slug)
    {
        const [project, versions] = await Promise.all([
            this.getProject(slug),
            this.getProjectVersions(slug)
        ]);

        if (project.icon_url)
        {
            project.icon_url_base64 = await fetchImageAsBase64(project.icon_url);
        }

        const latestVersions = [...versions]
            .sort((a, b) => new Date(b.date_published) - new Date(a.date_published))
            .slice(0, 5);

        return {
            project,
            versions: latestVersions,
            stats: {
                downloads: project.downloads || 0,
                followers: project.followers || 0,
                versionCount: versions.length
            }
        };
    }

    async getOrganizationStats(id)
    {
        const [organization, rawProjects] = await Promise.all([
            this.getOrganization(id),
            this.getOrganizationProjects(id)
        ]);

        const projects = normalizeV3ProjectFields(rawProjects);
        const allVersionDates = await fetchVersionDatesForProjects(projects, this.getProjectVersions.bind(this));

        if (organization.icon_url)
        {
            organization.icon_url_base64 = await fetchImageAsBase64(organization.icon_url);
        }

        await fetchImagesForProjects(projects);

        const stats = aggregateProjectStats(projects);

        return {
            organization,
            projects,
            stats: {
                ...stats,
                projectTypes: aggregateProjectTypes(projects),
                topGameVersions: aggregateGameVersions(projects),
                loaders: aggregateLoaders(projects),
                topCategories: aggregateCategories(projects),
                recentProject: findRecentProject(projects),
                allVersionDates
            }
        };
    }

    async getCollectionStats(id)
    {
        const collection = await this.getCollection(id);

        const projects = collection.projects && collection.projects.length > 0
            ? await this.getProjects(collection.projects)
            : [];

        const allVersionDates = await fetchVersionDatesForProjects(projects, this.getProjectVersions.bind(this));

        if (collection.icon_url)
        {
            collection.icon_url_base64 = await fetchImageAsBase64(collection.icon_url);
        }

        await fetchImagesForProjects(projects);

        const { totalDownloads, totalFollowers, projectCount, topProjects } = aggregateProjectStats(projects);

        return {
            collection,
            projects,
            stats: {
                totalDownloads,
                totalFollowers,
                projectCount,
                topProjects,
                allVersionDates
            }
        };
    }
}

export default new ModrinthClient();
