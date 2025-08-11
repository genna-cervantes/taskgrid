import { Pool } from "pg";

export const getUserWorkspaces = async (pool: Pool, username: string) => {
  if (!username) throw new Error("Bad request missing required fields");

  const userQuery = `SELECT id AS "userId" FROM users WHERE username = $1 AND is_active = TRUE LIMIT 1;`
  const userRes = await pool.query(userQuery, [username]);

  const userId = userRes.rows[0]?.userId;

  if (!userId) throw new Error("Bad request user does not exist");

  const query = `SELECT w.workspace_id AS "workspaceId", w.name, w.user_id = $1 AS "isOwner"
  FROM workspace_members AS wm 
  LEFT JOIN workspaces AS w 
  ON wm.workspace_id = w.workspace_id 
  WHERE wm.user_id = $1 AND w.is_active = TRUE AND wm.is_active = TRUE;`;
  const res = await pool.query(query, [userId]);

  return res.rows as { workspaceId: string; name: string, isOwner: boolean }[];
};

export const checkWorkspaceId = async (
  pool: Pool,
  workspaceId: string
) => {
  if (!workspaceId)
    throw new Error("Bad request missing required fields");

  const query = `SELECT name FROM workspaces WHERE workspace_id = $1 AND is_active = TRUE;`;
  const res = await pool.query(query, [workspaceId]);

  return res.rowCount === 1 ? (res.rows[0].name as string) : false;
};

export const insertWorkspace = async (
  pool: Pool,
  username: string,
  workspaceId: string,
  workspaceName: string
) => {
  if (!username || !workspaceId)
    throw new Error("Bad request missing required fields");
  
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const userQuery = 'SELECT id AS "userId" FROM users WHERE username = $1 AND is_active = TRUE LIMIT 1;'
    const userRes = await pool.query(userQuery, [username])
    
    const userId = userRes.rows[0]?.userId
    
    if (!userId){
      throw new Error("Bad request user does not exist");
    }

    const insertWorkspaceQuery = `
      INSERT INTO workspaces (workspace_id, name, user_id)
      VALUES ($1, $2, $3);
    `;
    const workspaceRes = await pool.query(insertWorkspaceQuery, [
      workspaceId,
      workspaceName,
      userId,
    ]);

    const insertUserWorkspaceLinkQuery = `INSERT INTO workspace_members (workspace_id, user_id) VALUES ($1, $2);`;
    const userWorkspaceRes = await client.query(insertUserWorkspaceLinkQuery, [
      workspaceId,
      userId,
    ]);

    await client.query("COMMIT");

    return userWorkspaceRes.rowCount === 1 &&
      userWorkspaceRes.rowCount === workspaceRes.rowCount
      ? {workspaceId: workspaceId}
      : false;

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateWorkspaceName = async (
  pool: Pool,
  workspaceId: string,
  workspaceName: string
) => {
  if (!workspaceId || !workspaceName)
    throw new Error("Bad request missing required fields");

  const query = `UPDATE workspaces SET name = $1 WHERE workspace_id = $2 AND is_active = TRUE;`;
  const res = await pool.query(query, [workspaceName, workspaceId]);

  return res.rowCount === 1 ? true : false;
};

export const deleteWorkspace = async (pool: Pool, workspaceId: string) => {
  if (!workspaceId) throw new Error("Bad request missing required fields");

  const query = 'UPDATE workspaces SET is_active = FALSE WHERE workspace_id = $1;';
  const res = await pool.query(query, [workspaceId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
}

export const leaveWorkspace = async (pool: Pool, workspaceId: string, username: string) => {
  if (!workspaceId) throw new Error("Bad request missing required fields");

  const userQuery = `SELECT id AS "userId" FROM users WHERE username = $1 AND is_active = TRUE LIMIT 1;`
  const userRes = await pool.query(userQuery, [username])

  const userId = userRes.rows[0]?.userId
  if (!userId){
    throw new Error("Bad request user does not exist");
  }
  
  const query = 'UPDATE workspaces SET is_active = FALSE WHERE workspace_id = $1 AND user_id = $2;';
  const res = await pool.query(query, [workspaceId, userId]);
  
  return (res.rowCount ?? 0) === 1 ? true : false;

}