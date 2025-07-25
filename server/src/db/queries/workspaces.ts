import { Pool } from "pg";

export const getUserWorkspaces = async (pool: Pool, guestId: string) => {
  if (!guestId) throw new Error('Bad request missing required fields');

  const query = `SELECT workspace_id AS workspaceId, name
    FROM workspaces
    WHERE user_id = $1 AND is_active = TRUE;`;
  const res = await pool.query(query, [guestId]);

  return res.rows as { workspaceId: string; name: string }[];
};

export const checkWorkspaceId = async (
  pool: Pool,
  guestId: string,
  workspaceId: string
) => {
  if (!guestId || !workspaceId) throw new Error('Bad request missing required fields');

  const query = `SELECT name FROM workspaces WHERE workspace_id = $1 AND user_id = $2 AND is_active = TRUE;`;
  const res = await pool.query(query, [workspaceId, guestId]);

  return res.rowCount === 1 ? (res.rows[0].name as string) : false;
};

export const insertWorkspace = async (
  pool: Pool,
  userId: string,
  workspaceId: string,
  workspaceName: string
) => {
  if (!userId || !workspaceId) throw new Error('Bad request missing required fields');

  const insertWorkspaceQuery = `
      INSERT INTO workspaces (workspace_id, name, user_id)
      VALUES ($1, $2, $3);
    `;
  const workspaceRes = await pool.query(insertWorkspaceQuery, [
    workspaceId,
    workspaceName,
    userId,
  ]);

  return (workspaceRes.rowCount ?? 0) === 1 ? true : false;
};
