import { Pool } from "pg";
import { ColumnKey, Project } from "../../shared/types.js";

export const addProject = async (
  pool: Pool,
  projectId: string,
  name: string,
  username: string,
  workspaceId: string
) => {
  if (!projectId || !username || !workspaceId)
    throw new Error("Bad request missing required fields");
  
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const userQuery = `SELECT id AS "userId" FROM users WHERE username = $1;`;
    const userRes = await pool.query(userQuery, [username])
    
    const userId = userRes.rows[0]?.userId;
    if (!userId){
      throw new Error("Bad request user does not exist");
    }

    const query =
      "INSERT INTO projects (id, name, user_id, workspace_id) VALUES ($1, $2, $3, $4)";
    const res = await pool.query(query, [
      projectId,
      name,
      userId,
      workspaceId,
    ]);

    const insertUserProjectLinkQuery = `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2);`;
    const userProjectsRes = await client.query(insertUserProjectLinkQuery, [
      projectId,
      userId,
    ]);

    await client.query("COMMIT");

    return userProjectsRes.rowCount === 1 &&
      res.rowCount === userProjectsRes.rowCount
      ? true
      : false;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getProjectOwner = async (pool: Pool, projectId: string) => {
  if (!projectId) throw new Error("Bad request missing required fields");

  const query =
    `SELECT username 
    FROM users AS u
    LEFT JOIN projects AS p 
    ON p.user_id = u.id
    WHERE p.id = $1 AND p.is_active = TRUE;`;
  const res = await pool.query(query, [projectId]);

  if ((res.rowCount ?? 0) < 1) throw new Error("Project not found");

  return res.rows[0]?.username as string;
};

export const getProjectStats = async (pool: Pool, projectId: string) => {
  if (!projectId) throw new Error("Bad request missing required fields");

  const query = `
  SELECT progress, COUNT(*) AS count
  FROM tasks
  WHERE project_id = $1 AND is_active = TRUE
  GROUP BY progress;
  `;
  const res = await pool.query(query, [projectId]);

  const allStatuses: ColumnKey[] = [
    "backlog",
    "in progress",
    "for checking",
    "done",
  ];

  const stats = Object.fromEntries(
    allStatuses.map((status) => {
      const found = res.rows.find((r) => r.progress === status);
      return [status, found ? Number(found.count) : 0];
    })
  );

  return stats as { [key in ColumnKey]: number };
};

export const editProjectName = async (
  pool: Pool,
  projectId: string,
  name: string,
  guestId: string
) => {
  if (!projectId || !guestId)
    throw new Error("Bad request missing required fields");

  const query =
    "UPDATE projects SET name = $1 WHERE id = $2 AND guest_id = $3 AND is_active = TRUE";
  const res = await pool.query(query, [name, projectId, guestId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const getProjectNameByKey = async (pool: Pool, id: string) => {
  if (!id) throw new Error("Bad request missing required fields");

  const query = "SELECT name FROM projects WHERE id = $1 AND is_active = TRUE";
  const res = await pool.query(query, [id]);

  if (!res.rows[0].name) throw new Error("Bad request project does not exist");

  return res.rows[0].name as string;
};

export const deleteProject = async (
  pool: Pool,
  id: string,
  guestId: string
) => {
  if (!id || !guestId) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE projects SET is_active = FALSE WHERE id = $1 AND guest_id = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [id, guestId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const getUserWorkspaceProjects = async (
  pool: Pool,
  username: string,
  workspaceId: string
) => {
  if (!username || !workspaceId)
    throw new Error("Bad request missing required fields");

  const userQuery = `SELECT id AS "userId" FROM users WHERE username = $1;`
  const userRes = await pool.query(userQuery, [username])

  const userId = userRes.rows[0]?.userId;

  if (!userId) throw new Error("Bad request user does not exist");

  const query = `SELECT p.id, p.name FROM projects AS p 
  LEFT JOIN project_members AS pm ON p.id = pm.project_id 
  WHERE p.workspace_id = $1 AND pm.user_id = $2;`;
  const res = await pool.query(query, [workspaceId, userId]);

  return res.rows as Project[];
};
