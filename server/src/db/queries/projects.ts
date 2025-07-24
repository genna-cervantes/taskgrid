import { Pool } from "pg";
import { ColumnKey, Project } from "../../shared/types.js";

export const addProject = async (
  pool: Pool,
  projectId: string,
  name: string,
  guestId: string,
  workspaceId: string
) => {
  if (!projectId || !guestId || !workspaceId) throw new Error('Bad request missing required fields');

  const query = "INSERT INTO projects (id, name, guest_id, workspace_id) VALUES ($1, $2, $3, $4)";
  const res = await pool.query(query, [projectId, name, guestId, workspaceId]);

  return res.rowCount;
};

export const getProjectOwner = async (pool: Pool, projectId: string) => {
  if (!projectId) throw new Error('Bad request missing required fields');
    
    const query =
    "SELECT guest_id FROM projects WHERE id = $1 AND is_active = TRUE;";
  const res = await pool.query(query, [projectId]);

  if ((res.rowCount ?? 0) < 1) throw new Error('Project not found')
    
    return res.rows[0].guest_id;
};

export const getProjectStats = async (pool: Pool, projectId: string) => {
  if (!projectId) throw new Error('Bad request missing required fields');

  const query = `
  SELECT progress, COUNT(*) AS count
  FROM tasks
  WHERE project_id = $1 AND is_active = TRUE
  GROUP BY progress;
  `
  const res = await pool.query(query, [projectId])

  const allStatuses: ColumnKey[] = ['backlog', 'in progress', 'for checking', 'done'];

  const stats = Object.fromEntries(
    allStatuses.map((status) => {
      const found = res.rows.find((r) => r.progress === status);
      return [status, found ? Number(found.count) : 0];
    })
  )

  return stats as { [key in ColumnKey]: number };
}

export const editProjectName = async (
  pool: Pool,
  projectId: string,
  name: string,
  guestId: string
) => {
  if (!projectId || !guestId) throw new Error('Bad request missing required fields');

  const query =
    "UPDATE projects SET name = $1 WHERE id = $2 AND guest_id = $3 AND is_active = TRUE";
  const res = await pool.query(query, [name, projectId, guestId]);

  return res.rowCount;
};

export const getProjectNameByKey = async (pool: Pool, id: string) => {
  if (!id) throw new Error('Bad request missing required fields');

  const query = "SELECT name FROM projects WHERE id = $1 AND is_active = TRUE";
  const res = await pool.query(query, [id]);

  return res.rows[0]?.name;
};

export const deleteProject = async (
  pool: Pool,
  id: string,
  guestId: string
) => {
  if (!id || !guestId) throw new Error('Bad request missing required fields');

  const query =
    "UPDATE projects SET is_active = FALSE WHERE id = $1 AND guest_id = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [id, guestId]);

  return res.rowCount;
};

export const getUserWorkspaceProjects = async (pool: Pool, guestId: string, workspaceId: string) => {
    if (!guestId || !workspaceId) throw new Error('Bad request missing required fields');

    if (guestId === "" || workspaceId === "") return []
  const query =
    `SELECT p.id, p.name, w.user_id AS guestId , w.workspace_id AS workspaceId
    FROM workspaces AS w
    LEFT JOIN projects AS p 
    ON p.workspace_id = w.workspace_id 
    WHERE w.user_id = $1 AND w.workspace_id = $2 AND p.is_active = TRUE AND w.is_active = TRUE;`;
  const res = await pool.query(query, [guestId, workspaceId]);

  return res.rows as Project[];
};