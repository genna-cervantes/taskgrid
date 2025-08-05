import { Pool } from "pg";

export const getUserWorkspaces = async (pool: Pool, guestId: string) => {
  if (!guestId) throw new Error("Bad request missing required fields");

  const query = `SELECT w.workspace_id AS "workspaceId", w.name 
  FROM workspace_members AS wm 
  LEFT JOIN workspaces AS w 
  ON wm.workspace_id = w.workspace_id 
  WHERE wm.guest_id = $1 AND w.is_active = TRUE AND wm.is_active = TRUE;`;
  const res = await pool.query(query, [guestId]);

  return res.rows as { workspaceId: string; name: string }[];
};

export const checkWorkspaceId = async (
  pool: Pool,
  guestId: string,
  workspaceId: string
) => {
  if (!guestId || !workspaceId)
    throw new Error("Bad request missing required fields");

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
  if (!userId || !workspaceId)
    throw new Error("Bad request missing required fields");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertWorkspaceQuery = `
      INSERT INTO workspaces (workspace_id, name, user_id)
      VALUES ($1, $2, $3);
    `;
    const workspaceRes = await pool.query(insertWorkspaceQuery, [
      workspaceId,
      workspaceName,
      userId,
    ]);

    const insertUserWorkspaceLinkQuery = `INSERT INTO workspace_members (workspace_id, guest_id) VALUES ($1, $2);`;
    const userWorkspaceRes = await client.query(insertUserWorkspaceLinkQuery, [
      workspaceId,
      userId,
    ]);

    await client.query("COMMIT");

    return userWorkspaceRes.rowCount === 1 &&
      userWorkspaceRes.rowCount === workspaceRes.rowCount
      ? workspaceId
      : false;

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
