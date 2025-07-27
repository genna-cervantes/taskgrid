import { Pool } from "pg";
import {
  ColumnKey,
  Comment,
  InsertableTask,
  Task,
} from "../../shared/types.js";
import { toSnakeCase } from "../../lib/utils.js";

export const getTasksFromProjectId = async (pool: Pool, id: string) => {
  if (!id) throw new Error("Bad request missing required fields");

  const query =
    'SELECT id, title, description, link, priority, progress, assign_to AS "assignTo", project_task_id AS "projectTaskId", files, target_start_date AS "targetStartDate", target_end_date AS "targetEndDate", category, depends_on AS "dependsOn", subtasks, index FROM tasks WHERE project_id = $1 AND is_active = TRUE';
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
  if (!projectId) throw new Error("Bad request missing required fields");

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
  if (!projectId || !taskId)
    throw new Error("Bad request missing required fields");

  const query =
    'SELECT id, title, description, link, priority, progress, assign_to AS "assignTo", project_task_id AS "projectTaskId", files, target_start_date AS "targetStartDate", target_end_date AS "targetEndDate", category, depends_on AS "dependsOn", subtasks, index FROM tasks WHERE project_id = $1 AND id = $2 AND is_active = TRUE LIMIT 1';
  const res = await pool.query(query, [projectId, taskId]);

  if (res.rows.length === 0) {
    throw new Error("Task not found");
  }

  const sanitized = {...Object.fromEntries(
      Object.entries(res.rows[0]).map(([key, value]) => [key, value === null ? undefined : value])
    ) } as Partial<Task>

  const task = {
    ...sanitized,
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
  if (!id || !task) throw new Error("Bad request missing required fields");

  const query =
    "INSERT INTO tasks (project_id, title, link, description, priority, progress, assign_to) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;";
  const res = await pool.query(query, [
    id,
    task.title,
    task.link,
    task.description,
    task.priority,
    task.progress,
    task.assignTo,
  ]);

  let taskId: string = res.rows[0].id.toString();

  if (!taskId) throw new Error("Bad request query retuned no id");

  return taskId;
};

export const updateTaskProgress = async (
  pool: Pool,
  taskId: string,
  progress: string
) => {
  if (!taskId || !progress)
    throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET progress = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [progress, parseInt(taskId)]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const deleteTask = async (pool: Pool, taskId: string) => {
  if (!taskId) throw new Error("Bad request missing required fields");

  const query = "UPDATE tasks SET is_active = FALSE WHERE id = $1";
  const res = await pool.query(query, [taskId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const updateAssignedTo = async (
  pool: Pool,
  taskId: string,
  assignTo: string[]
) => {
  if (!taskId || assignTo.length < 1)
    throw new Error("Bad request missing required fields");

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
  if (!taskId || !title) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET title = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [title, taskId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const updateTaskDescription = async (
  pool: Pool,
  taskId: string,
  description?: string
) => {
  if (!taskId) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET description = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [description, taskId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const updateTaskLink = async (
  pool: Pool,
  taskId: string,
  link?: string
) => {
  if (!taskId) throw new Error("Bad request missing required fields");

  const query = "UPDATE tasks SET link = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [link, taskId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const updateTaskPriority = async (
  pool: Pool,
  taskId: string,
  priority: string
) => {
  if (!taskId || !priority)
    throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET priority = $1 WHERE id = $2 AND is_active = TRUE";
  const res = await pool.query(query, [priority, taskId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const updateTaskFiles = async (
  pool: Pool,
  taskId: string,
  projectId: string,
  keys: string[],
  previousKeys: string[],
  uploads: {
    name: string;
    key: string;
    url: string;
  }[]
) => {
  if (!taskId || !projectId)
    throw new Error("Bad request missing required fields");

  if (keys.length + previousKeys.length > 3) {
    throw new Error("Too many task files");
  }

  const query =
    "UPDATE tasks SET files = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [
    [...keys, ...previousKeys],
    taskId,
    projectId,
  ]);

  return {
    success: (res.rowCount ?? 0) === 1 ? true : false,
    uploads,
  };
};

export const updateTaskTargetStartDate = async (
  pool: Pool,
  taskId: string,
  projectId: string,
  targetStartDate: Date | undefined
) => {
  if (!taskId || !projectId)
    throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET target_start_date = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [targetStartDate, taskId, projectId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const updateTaskTargetEndDate = async (
  pool: Pool,
  taskId: string,
  projectId: string,
  targetEndDate: Date | undefined
) => {
  if (!taskId || !projectId)
    throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET target_end_date = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [targetEndDate, taskId, projectId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const updateTaskCategory = async (
  pool: Pool,
  taskId: string,
  projectId: string,
  category: string | undefined
) => {
  if (!taskId || !projectId)
    throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET category = $1 WHERE id = $2 AND project_id = $3;";
  const res = await pool.query(query, [category, taskId, projectId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const deleteTaskById = async (pool: Pool, taskId: string) => {
  if (!taskId) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET is_active = FALSE WHERE id = $1 AND is_active = TRUE";
  const res = await pool.query(query, [taskId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const undoDeleteTask = async (pool: Pool, taskId: string) => {
  if (!taskId) throw new Error("Bad request missing required fields");

  const query = "UPDATE tasks SET is_active = TRUE WHERE id = $1";
  const res = await pool.query(query, [taskId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const getFilteredTasks = async (
  pool: Pool,
  priority: string,
  assignedTo: string,
  category: string,
  projectId: string
) => {
  if (!projectId) throw new Error("Bad request missing required fields");

  let priorityFilters = priority.split(",");
  let assignedToFilters = assignedTo.split(",");
  let categoryFitlers = category.split(",");

  let query = `
  SELECT id, title, description, link, priority, progress, 
         assign_to AS "assignTo", project_task_id AS "projectTaskId", 
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
  if (category !== "" && category.length > 0) {
    query += ` AND category = ANY($${paramIndex})`;
    values.push(categoryFitlers);
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
        commentCount: parseInt(commentRes.rows[0].count ?? "0", 10) ?? 0,
      };
    })
  );

  return tasksWithComments as Task[];
};

export const archiveTasksInColumn = async (
  pool: Pool,
  id: string,
  column: string
): Promise<true> => {
  if (!id || !column) throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET is_active = False WHERE project_id = $1 AND progress = $2 AND is_active = TRUE;";
  const res = await pool.query(query, [id, column]);

  return true;
};

// comments
export const addComment = async (
  pool: Pool,
  taskId: string,
  comment: string,
  commentBy: string
) => {
  if (!taskId || !comment || !commentBy)
    throw new Error("Bad request missing required fields");

  const query =
    "INSERT INTO task_comments_link (task_id, comment, comment_by) VALUES ($1, $2, $3);";
  const res = await pool.query(query, [taskId, comment, commentBy]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const getCommentsByTask = async (pool: Pool, taskId: string) => {
  if (!taskId) throw new Error("Bad request missing required fields");

  const query =
    'SELECT comment_id AS "commentId", comment, comment_by AS "commentBy", created_at AS "createdAt" FROM task_comments_link WHERE task_id = $1 AND is_active = TRUE;';
  const res = await pool.query(query, [taskId]);

  return res.rows as Comment[];
};

export const getTaskCategoryOptions = async (pool: Pool, projectId: string) => {
  if (!projectId) throw new Error("Bad request missing required fields");

  const query =
    'SELECT task_category_options AS "taskCategoryOptions" FROM projects WHERE id = $1 AND is_active = TRUE LIMIT 1;';
  const res = await pool.query(query, [projectId]);

  if (!res.rows[0].taskCategoryOptions)
    throw new Error("Bad request project does not exist");

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
  if (!projectId) throw new Error("Bad request missing required fields");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

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

    await client.query("COMMIT");

    return (res.rowCount ?? 0) === 1 ? true : false;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateTaskDependsOn = async (
  pool: Pool,
  projectId: string,
  taskId: string,
  dependsOn: { id: string; title: string }[]
) => {
  if (!taskId || !projectId)
    throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET depends_on = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;";
  const res = await pool.query(query, [dependsOn, taskId, projectId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
};

export const updateTaskSubTasks = async (
  pool: Pool,
  projectId: string,
  taskId: string,
  subTasks: { title: string; isDone: boolean }[]
) => {
  if (!taskId || !projectId)
    throw new Error("Bad request missing required fields");

  const query =
    "UPDATE tasks SET subtasks = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE RETURNING id, subtasks;";
  const res = await pool.query(query, [
    subTasks.slice(0, subTasks.length - 1),
    taskId,
    projectId,
  ]);

  let subtasks: {
    id: string,
    subtasks: {
      title: string,
      isDone: boolean
    }[]
  } = res.rows[0]

  return (res.rowCount ?? 0) === 1 ? subtasks : false;
};

export const updateTaskOrderBatched = async (
  pool: Pool,
  payload: { taskId: string; index: number; progress: ColumnKey }[],
  projectId: string
) => {
  if (!projectId) throw new Error("Bad request missing required fields");

  const taskIds = payload.map((t) => Number(t.taskId));
  const indices = payload.map((t) => t.index);
  const progressValues = payload.map((t) => t.progress);

  // Build CASE statements with proper parameter references
  const indexCases = payload
    .map((_, i) => `WHEN $${i + 1} THEN $${payload.length + i + 1}`)
    .join("\n");

  const progressCases = payload
    .map((_, i) => `WHEN $${i + 1} THEN $${2 * payload.length + i + 1}`)
    .join("\n");

  const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(", ");

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
  return res.rowCount === payload.length ? true : false;
};

export const updateTask = async (pool: Pool, taskId: string, updates: Partial<Task>) => {

  if (!taskId) throw new Error("Bad request missing required fields")

  const changedKeys = Object.keys(updates) as (keyof Task)[];
  const changedValues = changedKeys.map((ck) => (ck === "targetEndDate" || ck === "targetStartDate") && updates[ck] ? new Date(updates[ck]) : updates[ck]);
  let updatedQueries: string[] = []

  changedKeys.forEach((ck, i) => {
    updatedQueries.push(`${toSnakeCase(ck)} = $${i+1}`)
  })

  const query = `UPDATE tasks SET ${updatedQueries.join(', ')} WHERE id = $${changedKeys.length + 1}`;

  const res = await pool.query(query, [...changedValues, taskId]);

  return (res.rowCount ?? 0) === 1 ? true : false;
}