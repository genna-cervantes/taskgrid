import { Pool } from "pg";

// SAMPLE TO ALWAYS USE
export const insertUserWithWorkspace = async (
  pool: Pool,
  username: string,
  workspaceId: string,
  workspaceName: string
) => {
  if (!workspaceId || !workspaceName)
    throw new Error("Bad request missing required fields");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const email = `${username}@guest.local`

    const insertUserQuery = `
      INSERT INTO users (username, email, is_guest)
      VALUES ($1, $2, $3)
      RETURNING id AS "userId";
    `;
    const userRes = await client.query(insertUserQuery, [username, email, true]);

    const userId = userRes.rows[0]?.userId; // fallback if not auto ID
    
    if (!userId) throw new Error("User does not exist");
    
    const insertWorkspaceQuery = `
      INSERT INTO workspaces (workspace_id, name, user_id)
      VALUES ($1, $2, $3);
    `;
    const workspaceRes = await client.query(insertWorkspaceQuery, [
      workspaceId,
      workspaceName,
      userId,
    ]);

    const insertUserWorkspaceLinkQuery = `INSERT INTO workspace_members (workspace_id, user_id) VALUES ($1, $2);`;
    const userWorkspaceRes = await client.query(insertUserWorkspaceLinkQuery, [workspaceId, userId]);

    await client.query("COMMIT");

    return userWorkspaceRes.rowCount === 1 && userWorkspaceRes.rowCount === workspaceRes.rowCount && workspaceRes.rowCount === userRes.rowCount ? {username: username, workspaceId} : false;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const editUsername = async (
  pool: Pool,
  username: string,
  editedUsername: string
) => {
  if (!editedUsername || !username) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE users SET username = $1 WHERE username = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [editedUsername, username]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const checkGuestId = async (pool: Pool, guestId: string) => {
  if (!guestId) throw new Error("Bad request missing required fields");

  const query =
    "SELECT COUNT(*) FROM users WHERE guest_id = $1 AND is_active = TRUE;";
  const res = await pool.query(query, [guestId]);

  return parseInt(res.rows[0].count) === 1 ? true : false;
};

export const checkUsername = async (pool: Pool, username: string): Promise<number> => {
  if (!username) throw new Error('Bad request missing required fields');

  const query = 'SELECT COUNT(*) FROM users WHERE username = $1 AND is_active = TRUE;';
  const res = await pool.query(query, [username])

  return Number(res.rows[0].count ?? 0);
}

export const checkUsernameAndWorkspaces = async (
  pool: Pool,
  username: string
) => {
  if (!username) throw new Error("Bad request missing required fields");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const checkUserQuery =
      `SELECT id AS "userId", is_guest AS "isGuest" FROM users WHERE username = $1 AND is_active = TRUE LIMIT 1;`;
    const userRes = await client.query(checkUserQuery, [username]);

    const userId = userRes.rows[0]?.userId;
    const isGuest: boolean = userRes.rows[0]?.isGuest ?? true;

    if (!userId){
      return {
        userExists: false,
        isGuest: false,
        workspaces: [],
        username
      };
    }
    
    const getWorkspacesQuery = `SELECT workspace_id FROM workspaces WHERE user_id = $1 AND is_active = TRUE ORDER BY last_accessed DESC;`;
    const workspaceRes = await client.query(getWorkspacesQuery, [userId]);

    await client.query("COMMIT");
    
    return {
      userExists: !!userId,
      isGuest: isGuest,
      workspaces: workspaceRes.rows.map((w) => w.workspace_id as string),
      username
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
    "SELECT username FROM users WHERE guest_id = $1 AND is_active = TRUE";
  const res = await pool.query(query, [guestId]);

  if (!res.rows[0]?.username) throw new Error("Bad request user does not exist")

  return res.rows[0].username as string;
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

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const getUsersInProject = async (pool: Pool, id: string) => {
  if (!id) throw new Error("Bad request missing required fields");

  const query =
    `SELECT username 
    FROM users AS u
    LEFT JOIN project_members AS pm
    ON u.id = pm.user_id
    WHERE project_id = $1 AND pm.is_active = TRUE AND u.is_active = TRUE;`;
  const res = await pool.query(query, [id]);

  if (res.rowCount === 0) {
    return [];
  }

  let users = res.rows.map((r) => {
    return {
      username: r.username
    };
  });

  return users;
};

export const getUsernamesInProject = async (pool: Pool, id: string) => {
  if (!id) throw new Error("Bad request missing required fields");

  // SELECT USER ID JOIN WITH USERS TO GET USERNAME
  const query =
    `SELECT username 
    FROM users AS u
    LEFT JOIN project_members AS pm
    ON u.id = pm.user_id 
    WHERE pm.project_id = $1 AND pm.is_active = TRUE AND u.is_active = TRUE`;
  const res = await pool.query(query, [id]);

  if (res.rowCount === 0) {
    return [];
  }

  let usernames = res.rows.map((r) => r.username);
  return usernames as string[];
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
    "INSERT INTO user_project_link (project_id, guest_id) VALUES ($1, $2);";
  const res = await pool.query(query, [projectId, guestId]);

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

  return (res.rowCount ?? 0) === 1 ? true: false;
};

export const updateTimezone = async (pool: Pool, username: string, timezone: string) => {
  const query = 'UPDATE users SET timezone = $1 WHERE username = $2 AND is_active = TRUE;';
  const res = await pool.query(query, [timezone, username]);

  return (res.rowCount ?? 0) === 1;
}