import { Pool } from "pg";
import { ColumnKey, Comment, InsertableTask, Project, Task } from "../shared/types.js";

export const getUserWorkspaceProjects = async (pool: Pool, guestId: string, workspaceId: string) => {
  const query =
    `SELECT p.id, p.name, w.user_id AS guestId , w.workspace_id AS workspaceId
    FROM workspaces AS w
    LEFT JOIN projects AS p 
    ON p.workspace_id = w.workspace_id 
    WHERE w.user_id = $1 AND w.workspace_id = $2 AND p.is_active = TRUE AND w.is_active = TRUE;`;
  const res = await pool.query(query, [guestId, workspaceId]);

  return res.rows as Project[];
};

export const getUserWorkspaces = async (pool: Pool, guestId: string) => {
  const query =
    `SELECT workspace_id AS workspaceId, name
    FROM workspaces
    WHERE user_id = $1 AND is_active = TRUE;`;
  const res = await pool.query(query, [guestId]);
  
  return res.rows as {workspaceId: string, name: string}[];
}

export const checkWorkspaceId = async (pool: Pool, guestId: string, workspaceId: string) => {
  const query = `SELECT name FROM workspaces WHERE workspace_id = $1 AND user_id = $2 AND is_active = TRUE;`;
  const res = await pool.query(query, [workspaceId, guestId]);

  return res.rowCount === 1 ? res.rows[0].name as string : false;
}

export const getTasksFromProjectId = async (pool: Pool, id: string) => {
  const query =
    'SELECT id, title, description, link, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId", files, target_start_date AS "targetStartDate", target_end_date AS "targetEndDate", category, depends_on AS "dependsOn", subtasks, index FROM tasks WHERE project_id = $1 AND is_active = TRUE';
  const res = await pool.query(query, [id]);

  const tasks: Task[] = res.rows.map((task) => ({
    ...task,
    id: task.id.toString(),
  }));

  const tasksWithComments = await Promise.all(
    tasks.map(async (t) => {
      const commentQuery =
        "SELECT COUNT(*) FROM task_comments_link WHERE task_id = $1;";
      const commentRes = await pool.query(commentQuery, [t.id]);
      return {
        ...t,
        commentCount: parseInt(commentRes.rows[0].count, 10),
      };
    })
  );

  return tasksWithComments as Task[];
};

export const getTaskIds = async (pool: Pool, projectId: string) => {
  const query =
    "SELECT id, title FROM tasks WHERE project_id = $1 AND is_active = TRUE;";
  const res = await pool.query(query, [projectId]);

  const miniTasks = res.rows.map((t) => ({ ...t, id: new String(t.id) }));

  return miniTasks as { id: string; title: string }[];
};

export const getTaskById = async (
  pool: Pool,
  projectId: string,
  taskId: string
) => {
  const query =
    'SELECT id, title, description, link, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId", files, target_start_date AS "targetStartDate", target_end_date AS "targetEndDate", category, depends_on AS "dependsOn", subtasks, index FROM tasks WHERE project_id = $1 AND id = $2 AND is_active = TRUE LIMIT 1';
  const res = await pool.query(query, [projectId, taskId]);

  const task: Task = {
    ...res.rows[0],
    id: res.rows[0].id.toString(),
  };

  const commentQuery =
    "SELECT COUNT(*) FROM task_comments_link WHERE task_id = $1;";
  const commentRes = await pool.query(commentQuery, [task.id]);

  const tasksWithComments = {
    ...task,
    commentCount: parseInt(commentRes.rows[0].count, 10),
  };

  return tasksWithComments as Task;
};

export const insertTask = async (
  pool: Pool,
  task: InsertableTask,
  id: string
) => {
  const query =
    'INSERT INTO tasks (project_id, title, link, description, priority, progress, assign_to) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, description, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId";';
  const res = await pool.query(query, [
    id,
    task.title,
    task.link,
    task.description,
    task.priority,
    task.progress,
    task.assignedTo,
  ]);

  res.rows[0].id = res.rows[0].id.toString();

  return res.rows[0] as Task;
};

export const updateTaskProgress = async (
  pool: Pool,
  taskId: string,
  progress: string
) => {
  const query =
    "UPDATE tasks SET progress = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [progress, parseInt(taskId)]);

  return res.rowCount;
};

export const deleteTask = async (pool: Pool, taskId: string) => {
  const query = "UPDATE tasks SET is_active = FALSE WHERE id = $1";
  const res = await pool.query(query, [taskId]);

  return res.rowCount;
};

export const insertUser = async (
  pool: Pool,
  username: string,
  guestId: string
) => {
  const query = "INSERT INTO users (username, guest_id) VALUES ($1, $2)";
  const res = await pool.query(query, [username, guestId]);

  return res.rowCount;
};

// SAMPLE TO ALWAYS USE
export const insertUserWithWorkspace = async (pool: Pool, username: string, guestId: string, workspaceId: string, workspaceName: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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
    const workspaceRes = await client.query(insertWorkspaceQuery, [workspaceId, workspaceName, userId]);

    await client.query('COMMIT');

    return workspaceRes.rowCount === userRes.rowCount ? 1 : 0;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed:', err);
    return false;
  } finally {
    client.release();
  }
}

export const insertWorkspace = async (pool: Pool, userId: string, workspaceId: string, workspaceName: string ) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertWorkspaceQuery = `
      INSERT INTO workspaces (workspace_id, name, user_id)
      VALUES ($1, $2, $3);
    `;
    const workspaceRes = await client.query(insertWorkspaceQuery, [workspaceId, workspaceName, userId]);

    await client.query('COMMIT');

    return workspaceRes.rowCount;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed:', err);
    return false;
  } finally {
    client.release();
  }
}

export const setUsername = async (
  pool: Pool,
  username: string,
  guestId: string,
  id: string
) => {
  const query =
    "UPDATE user_project_link SET username = $1 WHERE guest_id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [username, guestId, id]);

  return res.rowCount;
};

export const checkGuestId = async (pool: Pool, guestId: string) => {
  const query =
    "SELECT COUNT(*) FROM users WHERE guest_id = $1 AND is_active = TRUE;";
  const res = await pool.query(query, [guestId]);

  return parseInt(res.rows[0].count);
};

export const checkGuestIdAndWorkspaces = async (pool: Pool, guestId: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const checkUserQuery = "SELECT COUNT(*) FROM users WHERE guest_id = $1 AND is_active = TRUE;";    
    const userRes = await client.query(checkUserQuery, [guestId]);

    const getWorkspacesQuery = `SELECT workspace_id FROM workspaces WHERE user_id = $1 AND is_active = TRUE;`;
    const workspaceRes = await client.query(getWorkspacesQuery, [guestId]);

    await client.query('COMMIT');

    return {
      userExists: parseInt(userRes.rows[0].count) === 1,
      workspaces: workspaceRes.rows.map((w) => w.workspace_id),
    };
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed:', err);
    throw err;
  } finally {
    client.release();
  }
};

export const getUsername = async (pool: Pool, id: string, guestId: string) => {
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
  const query =
    "UPDATE user_project_link SET is_active = FALSE WHERE project_id = $1 AND guest_id = $2;";
  const res = await pool.query(query, [id, guestId]);

  return res.rowCount;
};

export const getUsersInProject = async (pool: Pool, id: string) => {
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
  const query =
    "SELECT username FROM user_project_link WHERE project_id = $1 AND is_active = TRUE";
  const res = await pool.query(query, [id]);

  if (res.rowCount === 0) {
    return [];
  }

  let usernames = res.rows.map((r) => r.username);
  return usernames;
};

export const updateAssignedTo = async (
  pool: Pool,
  taskId: string,
  assignTo: string[]
) => {
  const query =
    "UPDATE tasks SET assign_to = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [assignTo, taskId]);

  return res.rowCount;
};

export const updateTaskTitle = async (
  pool: Pool,
  taskId: string,
  title: string
) => {
  const query =
    "UPDATE tasks SET title = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [title, taskId]);

  return res.rowCount;
};

export const updateTaskDescription = async (
  pool: Pool,
  taskId: string,
  description?: string
) => {
  const query =
    "UPDATE tasks SET description = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [description, taskId]);

  return res.rowCount;
};

export const updateTaskLink = async (
  pool: Pool,
  taskId: string,
  link?: string
) => {
  const query = "UPDATE tasks SET link = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [link, taskId]);

  return res.rowCount;
};

export const updateTaskPriority = async (
  pool: Pool,
  taskId: string,
  priority: string
) => {
  const query =
    "UPDATE tasks SET priority = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [priority, taskId]);

  return res.rowCount;
};

export const updateTaskFiles = async (
  pool: Pool,
  taskId: string,
  projectId: string,
  keys: string[],
  previousKeys: string[]
) => {
  if (keys.length + previousKeys.length > 3) {
    throw new Error("too many task files");
  }

  const query =
    "UPDATE tasks SET files = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [
    [...keys, ...previousKeys],
    taskId,
    projectId,
  ]);

  return res.rowCount;
};

export const updateTaskTargetStartDate = async (
  pool: Pool,
  taskId: string,
  projectId: string,
  targetStartDate: Date | undefined
) => {
  const query =
    "UPDATE tasks SET target_start_date = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [targetStartDate, taskId, projectId]);

  return res.rowCount;
};

export const updateTaskTargetEndDate = async (
  pool: Pool,
  taskId: string,
  projectId: string,
  targetEndDate: Date | undefined
) => {
  const query =
    "UPDATE tasks SET target_end_date = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [targetEndDate, taskId, projectId]);

  return res.rowCount;
};

export const updateTaskCategory = async (
  pool: Pool,
  taskId: string,
  projectId: string,
  category: string | undefined
) => {
  const query =
    "UPDATE tasks SET category = $1 WHERE id = $2 AND project_id = $3;";
  const res = await pool.query(query, [category, taskId, projectId]);

  return res.rowCount;
};

export const deleteTaskById = async (pool: Pool, taskId: string) => {
  const query =
    "UPDATE tasks SET is_active = FALSE WHERE id = $1 AND is_active = TRUE";
  const res = await pool.query(query, [taskId]);

  return res.rowCount;
};

export const undoDeleteTask = async (pool: Pool, taskId: string) => {
  const query = "UPDATE tasks SET is_active = TRUE WHERE id = $1";
  const res = await pool.query(query, [taskId]);

  return res.rowCount;
};

export const addProject = async (
  pool: Pool,
  projectId: string,
  name: string,
  guestId: string,
  workspaceId: string
) => {
  const query = "INSERT INTO projects (id, name, guest_id, workspace_id) VALUES ($1, $2, $3, $4)";
  const res = await pool.query(query, [projectId, name, guestId, workspaceId]);

  return res.rowCount;
};

export const getProjectOwner = async (pool: Pool, projectId: string) => {
  const query =
    "SELECT guest_id FROM projects WHERE id = $1 AND is_active = TRUE;";
  const res = await pool.query(query, [projectId]);

  return res.rows[0]?.guest_id;
};

export const getProjectStats = async (pool: Pool, projectId: string) => {
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

export const addUserProjectLink = async (
  pool: Pool,
  projectId: string,
  guestId: string,
  username: string
) => {
  const query =
    "INSERT INTO user_project_link (project_id, guest_id, username) VALUES ($1, $2, $3);";
  const res = await pool.query(query, [projectId, guestId, username]);

  return res.rowCount;
};

export const editProjectName = async (
  pool: Pool,
  projectId: string,
  name: string,
  guestId: string
) => {
  const query =
    "UPDATE projects SET name = $1 WHERE id = $2 AND guest_id = $3 AND is_active = TRUE";
  const res = await pool.query(query, [name, projectId, guestId]);

  return res.rowCount;
};

export const getProjectNameByKey = async (pool: Pool, id: string) => {
  const query = "SELECT name FROM projects WHERE id = $1 AND is_active = TRUE";
  const res = await pool.query(query, [id]);

  return res.rows[0]?.name;
};

export const deleteProject = async (
  pool: Pool,
  id: string,
  guestId: string
) => {
  const query =
    "UPDATE projects SET is_active = FALSE WHERE id = $1 AND guest_id = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [id, guestId]);

  return res.rowCount;
};

export const deleteUserProjectLink = async (
  pool: Pool,
  id: string,
  guestId: string
) => {
  const query =
    "UPDATE user_project_link SET is_active = FALSE WHERE project_id = $1 AND guest_id = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [id, guestId]);

  return res.rowCount;
};

export const getFilteredTasks = async (
  pool: Pool,
  priority: string,
  assignedTo: string,
  category: string,
  projectId: string
) => {
  let priorityFilters = priority.split(",");
  let assignedToFilters = assignedTo.split(",");
  let categoryFitlers = category.split(",");

  let query = `
  SELECT id, title, description, link, priority, progress, 
         assign_to AS "assignedTo", project_task_id AS "projectTaskId", 
         files, target_start_date AS "targetStartDate", 
         target_end_date AS "targetEndDate", category, 
         depends_on AS "dependsOn", subtasks, index
  FROM tasks
  WHERE project_id = $1 AND is_active = TRUE
`;

  let values: any[] = [projectId];
  let paramIndex = 2;

  // Add priority filter
  if (priority !== "" && priorityFilters.length > 0) {
    query += ` AND priority = ANY($${paramIndex})`;
    values.push(priorityFilters);
    paramIndex++;
  }

  // Add assignedTo filter
  if (assignedTo !== "" && assignedToFilters.length > 0) {
    query += ` AND assign_to && $${paramIndex}`; // overlap check
    values.push(assignedToFilters);
    paramIndex++;
  }

  // Add category fitler
  if (category !== "" && category.length > 0){
    query += ` AND category = ANY($${paramIndex})`;
    values.push(categoryFitlers)
    paramIndex++;
  }

  const res = await pool.query(query, values);

  const tasks: Task[] = res.rows.map((task) => ({
    ...task,
    id: task.id.toString(),
  }));

  const tasksWithComments = await Promise.all(
    tasks.map(async (t) => {
      const commentQuery =
        "SELECT COUNT(*) FROM task_comments_link WHERE task_id = $1;";
      const commentRes = await pool.query(commentQuery, [t.id]);
      return {
        ...t,
        commentCount: parseInt(commentRes.rows[0].count, 10),
      };
    })
  );

  return tasksWithComments as Task[];
};

export const archiveTasksInColumn = async (
  pool: Pool,
  id: string,
  column: string
) => {
  const query =
    "UPDATE tasks SET is_active = False WHERE project_id = $1 AND progress = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [id, column]);

  return res.rowCount;
};

// comments
export const addComment = async (
  pool: Pool,
  taskId: string,
  comment: string,
  commentBy: string
) => {
  const query =
    "INSERT INTO task_comments_link (task_id, comment, comment_by) VALUES ($1, $2, $3);";
  const res = await pool.query(query, [taskId, comment, commentBy]);

  return res.rowCount;
};

export const getCommentsByTask = async (pool: Pool, taskId: string) => {
  const query =
    'SELECT comment_id AS "commentId", comment, comment_by AS "commentBy", created_at AS "createdAt" FROM task_comments_link WHERE task_id = $1 AND is_active = TRUE;';
  const res = await pool.query(query, [taskId]);

  return res.rows as Comment[];
};

export const getTaskCategoryOptions = async (pool: Pool, projectId: string) => {
  const query =
    'SELECT task_category_options AS "taskCategoryOptions" FROM projects WHERE id = $1 AND is_active = TRUE LIMIT 1;';
  const res = await pool.query(query, [projectId]);

  return res.rows[0].taskCategoryOptions as {
    category: string;
    color: string;
  }[];
};

export const updateTaskCategoryOptions = async (
  pool: Pool,
  projectId: string,
  taskCategoryOptions: { category: string; color: string }[]
) => {
  const query1 =
    'SELECT task_category_options AS "taskCategoryOptions" FROM projects WHERE id = $1 AND is_active = true;';
  const res1 = await pool.query(query1, [projectId]);

  const prevTaskCategories =
    res1.rows[0]?.taskCategoryOptions?.map(
      (c: { category: string }) => c.category
    ) || [];
  const newTaskCategories = taskCategoryOptions.map((c) => c.category);

  const removedTaskCategories = prevTaskCategories.filter(
    (c: string) => !newTaskCategories.includes(c)
  );

  // remove all removed categories from category column as well
  if (removedTaskCategories.length > 0) {
    const query2 = `
        UPDATE tasks
        SET category = null
        WHERE category = ANY($1)
            AND project_id = $2
            AND is_active = TRUE;
        `;
    await pool.query(query2, [removedTaskCategories, projectId]);
  }

  const query =
    "UPDATE projects SET task_category_options = $1 WHERE id = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [
    JSON.stringify(taskCategoryOptions),
    projectId,
  ]);

  return res.rowCount;
};

export const updateTaskDependsOn = async (
  pool: Pool,
  projectId: string,
  taskId: string,
  dependsOn: { id: string; title: string }[]
) => {
  const query =
    "UPDATE tasks SET depends_on = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [dependsOn, taskId, projectId]);

  return res.rowCount;
};

export const updateTaskSubTasks = async (
  pool: Pool,
  projectId: string,
  taskId: string,
  subTasks: { title: string; isDone: boolean }[]
) => {
  const query =
    "UPDATE tasks SET subtasks = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [
    subTasks.slice(0, subTasks.length - 1),
    taskId,
    projectId,
  ]);

  return res.rowCount;
};

export const updateTaskOrderBatched = async (
  pool: Pool,
  payload: { taskId: string; index: number; progress: ColumnKey }[],
  projectId: string
): Promise<number> => {
  if (payload.length === 0) return 0;

  const taskIds = payload.map((t) => Number(t.taskId));
  const indices = payload.map((t) => t.index);
  const progressValues = payload.map((t) => t.progress);

  // Build CASE statements with proper parameter references
  const indexCases = payload
    .map((_, i) => `WHEN $${i + 1} THEN $${payload.length + i + 1}`)
    .join('\n');
  
  const progressCases = payload
    .map((_, i) => `WHEN $${i + 1} THEN $${2 * payload.length + i + 1}`)
    .join('\n');

  const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    UPDATE tasks
    SET
      index = (CASE id
        ${indexCases}
      END)::integer,
      progress = (CASE id
        ${progressCases}
      END)::text
    WHERE id IN (${placeholders})
      AND project_id = $${3 * payload.length + 1}
  `;

  // Parameters: taskIds, indices, progressValues, projectId
  const values = [...taskIds, ...indices, ...progressValues, projectId];

  const res = await pool.query(query, values);
  return res.rowCount || 0;
};
