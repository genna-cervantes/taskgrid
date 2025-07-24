import { Pool } from "pg";

// SAMPLE TO ALWAYS USE
export const insertUserWithWorkspace = async (
  pool: Pool,
  username: string,
  guestId: string,
  workspaceId: string,
  workspaceName: string
) => {
  if (!guestId || !workspaceId || !workspaceName)
    throw new Error("Bad request missing required fields");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertUserQuery = `
      INSERT INTO users (username, guest_id)
      VALUES ($1, $2)
      RETURNING guest_id;
    `;
    const userRes = await client.query(insertUserQuery, [username, guestId]);

    const insertWorkspaceQuery = `
      INSERT INTO workspaces (workspace_id, name, user_id)
      VALUES ($1, $2, $3);
    `;
    const userId = userRes.rows[0].guest_id || guestId; // fallback if not auto ID
    const workspaceRes = await client.query(insertWorkspaceQuery, [
      workspaceId,
      workspaceName,
      userId,
    ]);

    await client.query("COMMIT");

    return workspaceRes.rowCount === userRes.rowCount ? 1 : 0;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const setUsername = async (
  pool: Pool,
  username: string,
  guestId: string,
  id: string
) => {
  if (!guestId || !id) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE user_project_link SET username = $1 WHERE guest_id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [username, guestId, id]);

  return res.rowCount;
};

export const checkGuestId = async (pool: Pool, guestId: string) => {
  if (!guestId) throw new Error("Bad request missing required fields");

  const query =
    "SELECT COUNT(*) FROM users WHERE guest_id = $1 AND is_active = TRUE;";
  const res = await pool.query(query, [guestId]);

  return parseInt(res.rows[0].count);
};

export const checkGuestIdAndWorkspaces = async (
  pool: Pool,
  guestId: string
) => {
  if (!guestId) throw new Error("Bad request missing required fields");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const checkUserQuery =
      "SELECT COUNT(*) FROM users WHERE guest_id = $1 AND is_active = TRUE;";
    const userRes = await client.query(checkUserQuery, [guestId]);

    const getWorkspacesQuery = `SELECT workspace_id FROM workspaces WHERE user_id = $1 AND is_active = TRUE;`;
    const workspaceRes = await client.query(getWorkspacesQuery, [guestId]);

    await client.query("COMMIT");

    return {
      userExists: parseInt(userRes.rows[0].count) === 1,
      workspaces: workspaceRes.rows.map((w) => w.workspace_id),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getUsername = async (pool: Pool, id: string, guestId: string) => {
  if (!guestId || !id) throw new Error("Bad request missing required fields");

  const query =
    "SELECT username FROM user_project_link WHERE project_id = $1 AND guest_id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [id, guestId]);

  return res.rows[0]?.username ?? "";
};

export const kickUserFromProject = async (
  pool: Pool,
  id: string,
  guestId: string
) => {
  if (!guestId || !id) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE user_project_link SET is_active = FALSE WHERE project_id = $1 AND guest_id = $2;";
  const res = await pool.query(query, [id, guestId]);

  return res.rowCount;
};

export const getUsersInProject = async (pool: Pool, id: string) => {
  if (!id) throw new Error("Bad request missing required fields");

  const query =
    "SELECT username, guest_id AS guestId FROM user_project_link WHERE project_id = $1 AND is_active = TRUE;";
  const res = await pool.query(query, [id]);

  if (res.rowCount === 0) {
    return [];
  }

  let users = res.rows.map((r) => {
    return {
      username: r.username,
      guestId: r.guestid,
    };
  });

  return users;
};

export const getUsernamesInProject = async (pool: Pool, id: string) => {
  if (!id) throw new Error("Bad request missing required fields");

  const query =
    "SELECT username FROM user_project_link WHERE project_id = $1 AND is_active = TRUE";
  const res = await pool.query(query, [id]);

  if (res.rowCount === 0) {
    return [];
  }

  let usernames = res.rows.map((r) => r.username);
  return usernames;
};

export const addUserProjectLink = async (
  pool: Pool,
  projectId: string,
  guestId: string,
  username: string
) => {
  if (!guestId || !projectId)
    throw new Error("Bad request missing required fields");

  const query =
    "INSERT INTO user_project_link (project_id, guest_id, username) VALUES ($1, $2, $3);";
  const res = await pool.query(query, [projectId, guestId, username]);

  return res.rowCount;
};

export const deleteUserProjectLink = async (
  pool: Pool,
  id: string,
  guestId: string
) => {
  if (!guestId || !id) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE user_project_link SET is_active = FALSE WHERE project_id = $1 AND guest_id = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [id, guestId]);

  return res.rowCount;
};

export const insertUser = async (
  pool: Pool,
  username: string,
  guestId: string
) => {
  if (!guestId) throw new Error("Bad request missing required fields");

  const query = "INSERT INTO users (username, guest_id) VALUES ($1, $2)";
  const res = await pool.query(query, [username, guestId]);

  return res.rowCount;
};
