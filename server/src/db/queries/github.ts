import { Pool } from "pg";
import { GithubInstallation } from "../../shared/types.js";

export const addInstallation = async (pool: Pool, installation: GithubInstallation) => {
    if (!installation) throw new Error("Bad request missing required fields");

    const query = 'UPDATE github_installations SET account_type = $1, account_login = $2, repository_ids = $3, access_token_url = $4 WHERE installation_id = $5 AND project_id = $6;'
    const res = await pool.query(query, [installation.account_type, installation.account_login, installation.repository_ids, installation.access_token_url, installation.installation_id, installation.project_id])
    
    return (res?.rowCount ?? 0) === 1;
}

export const initializeGithubInstallation = async (pool: Pool, installationId: string, projectId: string, username: string) => {
    if (!installationId || !projectId || !username) throw new Error("Bad request missing required fields");

    const query = 'INSERT INTO github_installations (installation_id, project_id, username) VALUES ($1, $2, $3);'
    const res = await pool.query(query, [installationId, projectId, username])
    return (res?.rowCount ?? 0) === 1;
}

export const getProjectIdFromInstallationId = async (pool: Pool, installationId: number) => {
    if (!installationId) throw new Error("Bad request missing required fields");
    
    const query = 'SELECT project_id AS "projectId" FROM github_installations WHERE installation_id = $1;'
    const res = await pool.query(query, [installationId])

    const projectIds = res.rows.map((r) => r.projectId)

    return projectIds ?? [];
}

export const getProjectIdFromRepositoryId = async (pool: Pool, repositoryId: number) => {
    if (!repositoryId) throw new Error("Bad request missing required fields");

    const query = `SELECT project_id AS "projectId" FROM github_installations WHERE (repository_ids -> 'repositoryIds') @> jsonb_build_array($1::bigint);`
    const res = await pool.query(query, [repositoryId])
    
    const projectIds = res.rows.map((r) => r.projectId)

    return projectIds ?? [];
}