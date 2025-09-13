import { Pool, PoolClient } from "pg";
import {
  ColumnKey,
  Comment,
  InsertableTask,
  Task,
} from "../../shared/types.js";
import { getDataIdFromComment, handleSyncNotification, toSnakeCase } from "../../lib/utils.js";
import { OpenAi } from "../../ai/functions.js";
import { insertAsyncNotification } from "./notifications.js";

export const getTasksFromProjectId = async (pool: Pool, id: string) => {
  if (!id) throw new Error("Bad request missing required fields");

  const query = `SELECT id, title, description, link, priority, progress, assign_to AS "assignTo", project_task_id AS "projectTaskId", files, target_start_date AS "targetStartDate", target_end_date AS "targetEndDate", category, depends_on AS "dependsOn", subtasks, index, FLOOR(EXTRACT(EPOCH FROM (now() - progress_updated_at)) / 86400)::int AS "daysInColumn" FROM tasks WHERE project_id = $1 AND is_active = TRUE`;
  const res = await pool.query(query, [id]);

  const tasks: Task[] = res.rows.map((task) => ({
    ...task,
    id: task.id.toString(),
    category: task.category === null ? undefined : task.category,
    subtasks: task.subtasks === null ? [] : task.subtasks,
    dependsOn: task.dependsOn === null ? [] : task.dependsOn,

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
    'SELECT id, title, description, link, priority, progress, assign_to AS "assignTo", project_task_id AS "projectTaskId", files, target_start_date AS "targetStartDate", target_end_date AS "targetEndDate", category, depends_on AS "dependsOn", subtasks, index, FLOOR(EXTRACT(EPOCH FROM (now() - progress_updated_at)) / 86400)::int AS "daysInColumn" FROM tasks WHERE project_id = $1 AND id = $2 AND is_active = TRUE LIMIT 1';
  const res = await pool.query(query, [projectId, taskId]);

  if (res.rows.length === 0) {
    throw new Error("Task not found");
  }

  const sanitized = {
    ...Object.fromEntries(
      Object.entries(res.rows[0]).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    ),
  } as Partial<Task>;

  const task = {
    ...sanitized,
    id: res.rows[0].id.toString(),
    subtasks: sanitized.subtasks === null ? [] : sanitized.subtasks,
    dependsOn: sanitized.dependsOn === null ? [] : sanitized.dependsOn,
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

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const query =
      "INSERT INTO tasks (project_id, title, description, priority, assign_to, progress, link, category, files, target_start_date, target_end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id;";
    const res = await client.query(query, [
      id,
      task.title,
      task.description,
      task.priority,
      task.assignTo,
      task.progress,
      task.link ?? undefined,
      task.category ?? undefined,
      task.files ?? [],
      task.targetStartDate ?? undefined,
      task.targetEndDate ?? undefined,
    ]);

    let taskId: string = res.rows[0].id.toString();

    if (!taskId) throw new Error("Bad request query retuned no id");

    // add to column history
    await updateColumnHistory(client, taskId, null, task.progress);

    // process embedding
    const embedResult = await OpenAi.embeddings.create({
      model: "text-embedding-3-small",
      input: JSON.stringify(task),
    });
    const embedding = embedResult.data[0].embedding;
    const vectorString = `[${embedding.join(",")}]`;

    const embeddingQuery =
      "UPDATE tasks SET embedding = $1 WHERE id = $2 AND is_active = TRUE;";
    const embeddingRes = await client.query(embeddingQuery, [
      vectorString,
      taskId,
    ]);

    if ((embeddingRes?.rowCount ?? 0) !== 1)
      throw new Error("Error creating task unable to insert embedding");

    await client.query("COMMIT");
    return taskId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateTaskProgress = async (
  pool: Pool,
  taskId: string,
  progress: string
) => {
  if (!taskId || !progress)
    throw new Error("Bad request missing required fields");

  const client = await pool.connect();

  try{
    await client.query("BEGIN");
  
    const query = `UPDATE tasks t
      SET progress = $1
      FROM (SELECT id, progress AS "oldProgress" FROM tasks WHERE id = $2) s
      WHERE t.id = s.id AND t.is_active = TRUE
      RETURNING t.id, s.oldProgress;`;
    const res = await client.query(query, [progress, parseInt(taskId)]);

    if (res.rowCount !== 1) throw new Error("Error updating task progress");

    await updateColumnHistory(client, taskId, res.rows[0].oldProgress, progress);

    await client.query("COMMIT");
  
    return (res.rowCount ?? 0) === 1;
  }catch(err){
    await client.query("ROLLBACK");
    throw err;
  }finally{
    client.release();
  }
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
  progress: string,
  projectTaskIds: string,
  projectId: string,
  limit?: number
) => {
  if (!projectId) throw new Error("Bad request missing required fields");

  let priorityFilters = priority.split(",");
  let assignedToFilters = assignedTo.split(",");
  let categoryFitlers = category.split(",");
  let projectTaskIdFilters = projectTaskIds.split(",");
  let progressFilters = progress.split(",");

  let query = `
  SELECT id, title, description, link, priority, progress, 
         assign_to AS "assignTo", project_task_id AS "projectTaskId", 
         files, target_start_date AS "targetStartDate", 
         target_end_date AS "targetEndDate", category, 
         depends_on AS "dependsOn", subtasks, index,
         FLOOR(EXTRACT(EPOCH FROM (now() - progress_updated_at)) / 86400)::int AS "daysInColumn"
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

  // Add project task id fitler
  if (projectTaskIds !== "" && projectTaskIds.length > 0) {
    query += ` AND project_task_id = ANY($${paramIndex})`;
    values.push(projectTaskIdFilters.map((ptf) => Number(ptf)));
    paramIndex++;
  }

  // Add progress filter
  if (progress !== "" && progress.length > 0) {
    query += ` AND progress = ANY($${paramIndex})`;
    values.push(progressFilters);
    paramIndex++;
  }

  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  const res = await pool.query(query, values);

  const tasks: Task[] = res.rows.map((task) => ({
    ...task,
    id: task.id.toString(),
    category: task.category === null ? undefined : task.category,
    subtasks: task.subtasks === null ? [] : task.subtasks,
    dependsOn: task.dependsOn === null ? [] : task.dependsOn,
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
  projectId: string,
  comment: string,
  commentBy: string
) => {
  if (!taskId || !comment || !commentBy)
    throw new Error("Bad request missing required fields");

  // get project task id
  const projectTaskIdQuery = 'SELECT project_task_id AS "projectTaskId" FROM tasks WHERE id = $1 AND is_active = TRUE;';
  const projectTaskIdRes = await pool.query(projectTaskIdQuery, [taskId]);
  const projectTaskId = projectTaskIdRes.rows[0].projectTaskId;
  
  // theres a mention add to notifs
  if (comment.includes(`data-type="mention"`)){
    const recipient = getDataIdFromComment(comment)
    if (recipient == null){
      throw new Error("Error parsing comment with mention");
    }
    
    await handleSyncNotification('mention', projectTaskId, projectId, {recipient: recipient}, {comment: comment})
  }

  const query =
    "INSERT INTO task_comments_link (task_id, comment, comment_by) VALUES ($1, $2, $3);";
  const res = await pool.query(query, [taskId, comment, commentBy]);

  await insertAsyncNotification(pool, 'update_discussion', projectTaskId, projectId, {recipient: "all"}, {})

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

  return res.rows[0].taskCategoryOptions as {
    category: string;
    color: string;
  }[];
};

export const addTaskCategoryOptions = async (
  pool: Pool,
  projectId: string,
  taskCategoryOption: { category: string; color: string }
) => {
  if (!projectId) throw new Error("Bad request missing required fields");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const query =
      "UPDATE projects SET task_category_options = COALESCE(task_category_options, '[]'::jsonb) || $1 WHERE id = $2 AND is_active = TRUE;";
    const res = await client.query(query, [
      JSON.stringify([taskCategoryOption]),
      projectId,
    ]);

    await client.query("COMMIT");

    if (res?.rowCount === 1) {
      return taskCategoryOption;
    }

    return false;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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
    const res1 = await client.query(query1, [projectId]);

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
      await client.query(query2, [removedTaskCategories, projectId]);
    }

    const query =
      "UPDATE projects SET task_category_options = $1 WHERE id = $2 AND is_active = TRUE;";

    const res = await client.query(query, [
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
    id: string;
    subtasks: {
      title: string;
      isDone: boolean;
    }[];
  } = res.rows[0];

  return (res.rowCount ?? 0) === 1 ? subtasks : false;
};

export const updateColumnHistory = async (client: PoolClient, taskId: string, previousProgress: string|null, newProgress: string) => {
  if (!taskId || !newProgress) throw new Error("Bad request missing required fields");

  try{
    await client.query("BEGIN");

    let sequenceNumber = 0;
    if (previousProgress){
      const columnHistorySequenceNumberQuery = `
      SELECT COALESCE(MAX(sequence_number), 0) + 1 as "nextSequenceNumber" 
      FROM task_column_history 
      WHERE task_id = $1 
      `;

      const columnHistorySequenceNumberRes = await client.query(columnHistorySequenceNumberQuery, [taskId]);
      sequenceNumber = columnHistorySequenceNumberRes.rows[0].nextSequenceNumber;

      if (columnHistorySequenceNumberRes.rowCount !== 1) throw new Error("Error getting column history sequence number");
      
      // update previous column history
      const previousColumnHistoryQuery = "UPDATE task_column_history SET exited_at = $1, is_current = FALSE WHERE task_id = $2 AND column_name = $3 AND exited_at IS NULL AND is_current = TRUE";
      const previousColumnHistoryRes = await client.query(previousColumnHistoryQuery, [
        new Date(),
        taskId,
        previousProgress
      ]);
      
      if (previousColumnHistoryRes.rowCount !== 1) throw new Error("Error updating previous column history");
    }

    // add to column history
    const columnHistoryQuery = "INSERT INTO task_column_history (task_id, column_name, entered_at, sequence_number) VALUES ($1, $2, $3, $4)";
    const columnHistoryRes = await client.query(columnHistoryQuery, [
      taskId,
      newProgress,
      new Date(),
      sequenceNumber
    ]);

    if (columnHistoryRes?.rowCount !== 1) throw new Error("Error updating new column history");

    await client.query("COMMIT");
  }catch(err){
    console.error(err)
    await client.query("ROLLBACK");
    throw err;
  }finally{
    client.release();
  }
}

export const updateTaskOrderBatched = async (
  pool: Pool,
  payload: { taskId: string; index: number; progress: ColumnKey }[],
  projectId: string
) => {
  if (!projectId) throw new Error("Bad request missing required fields");

  const taskIds = payload.map((t) => Number(t.taskId));
  const indices = payload.map((t) => t.index);
  const progressValues = payload.map((t) => t.progress);

  const client = await pool.connect();

  try{
    await client.query("BEGIN");
    // Build CASE statements with proper parameter references
    const indexCases = payload
      .map((_, i) => `WHEN $${i + 1} THEN $${payload.length + i + 1}`)
      .join("\n");
  
    const progressCases = payload
      .map((_, i) => `WHEN $${i + 1} THEN $${2 * payload.length + i + 1}`)
      .join("\n");
  
    const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(", ");
  
    const query = `
      WITH old_values AS (
        SELECT id, project_task_id as project_task_id, progress as old_progress
        FROM tasks
        WHERE id IN (${placeholders}) AND project_id = $${3 * payload.length + 1}
      )
      UPDATE tasks
      SET
        index = (CASE tasks.id ${indexCases} END)::integer,
        progress = (CASE tasks.id ${progressCases} END)::text
      FROM old_values  
      WHERE tasks.id = old_values.id  
        AND tasks.project_id = $${3 * payload.length + 1}
      RETURNING 
        tasks.id, 
        tasks.progress,        
        tasks.project_task_id,
        old_values.old_progress
    `;
  
    // Parameters: taskIds, indices, progressValues, projectId
    const values = [...taskIds, ...indices, ...progressValues, projectId];
  
    const res = await client.query(query, values);
    const changedTasks = res.rows
      .filter(row => row.old_progress !== row.progress) // changed progress
      .map(row => ({id: row.id, projectTaskId: row.project_task_id, oldProgress: row.old_progress, newProgress: row.progress}))  

    await Promise.all(
      changedTasks.map((ct) => {
        return updateColumnHistory(client, ct.id, ct.oldProgress, ct.newProgress);
      })
    )
    
    await Promise.all(
      changedTasks.map((ct) => {
        return insertAsyncNotification(pool, 'update_progress', ct.projectTaskId, projectId, {recipient: 'all'}, {oldProgress: ct.oldProgress, newProgress: ct.newProgress})
      })
    )
  
    await client.query("COMMIT");
    return res.rowCount === payload.length ? true : false;
  }catch(err){
    console.error(err)
    await client.query("ROLLBACK");
    throw err;
  }finally{
    client.release();
  }

};

export const updateTask = async (
  pool: Pool,
  taskId: string,
  updates: Partial<Task>
) => {
  if (!taskId) throw new Error("Bad request missing required fields");

  let previousProgress = null;
  if (updates.progress){
    const previousProgressQuery = 'SELECT progress FROM tasks WHERE id = $1;';
    const previousProgressRes = await pool.query(previousProgressQuery, [taskId]);
    previousProgress = previousProgressRes.rows[0].progress;
  }

  const changedKeys = Object.keys(updates) as (keyof Task)[];
  const changedValues = changedKeys.map((ck) =>
    (ck === "targetEndDate" || ck === "targetStartDate") && updates[ck]
      ? new Date(updates[ck])
      : updates[ck]
  );
  let updatedQueries: string[] = [];

  changedKeys.forEach((ck, i) => {
    updatedQueries.push(`${toSnakeCase(ck)} = $${i + 1}`);
  });

  const client = await pool.connect();

  try{
    await client.query("BEGIN");
    
    const query = `UPDATE tasks SET ${updatedQueries.join(", ")} WHERE id = $${
      changedKeys.length + 1
    }`;
  
    const res = await client.query(query, [...changedValues, taskId]);
  
    if (updates.progress && previousProgress) {
      await updateColumnHistory(client, taskId, previousProgress, updates.progress)
    }

    await client.query("COMMIT");
    return (res.rowCount ?? 0) === 1;
  }catch(err){
    await client.query("ROLLBACK");
    throw err;
  }finally{
    client.release();
  }

};

export const getSimilarTasks = async (
  pool: Pool,
  projectId: string,
  embedding: string,
  filter?: {
    assignTo: string[]
  },
  limit: number = 1
): Promise<{
  id: string;
  title: string;
  description: string | undefined;
  priority: "low" | "medium" | "high";
  assign_to: string[];
}[]> => {
  if (!projectId || !embedding)
    throw new Error("Bad request missing required fields");

  let query = `SELECT id, title, description, priority, assign_to, 1 - (embedding <=> $2) AS cosine_similarity
  FROM tasks 
  WHERE project_id = $1 
    AND (1 - (embedding <=> $2)) >= 0.84 
    AND is_active = TRUE`;

  let values: any[] = [projectId, embedding]; // Assuming these are your first two params
  let paramCount = 2;

  if (filter && filter.assignTo.length > 0) {
    paramCount++;
    query += ` AND assign_to = ANY($${paramCount})`;
    values.push(filter.assignTo);
  }

  query += ' ORDER BY embedding <=> $2';

  if (limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(limit);
  }
  const res = await pool.query(query, values);

  return res?.rows ?? [];
};

export const getTaskEffortInMs = async (pool: Pool, taskId: string) => {
  if (!taskId) throw new Error("Bad request: missing required fields");

  const query = `
    SELECT entered_at, exited_at, is_current
    FROM task_column_history 
    WHERE task_id = $1 AND column_name = 'in progress'
  `;
  
  const res = await pool.query(query, [parseInt(taskId.toString())]);

  let totalTimeMs = 0;
  
  res.rows.forEach((row) => {
    const enteredAt = new Date(row.entered_at);
    const exitedAt = row.exited_at 
      ? new Date(row.exited_at) 
      : (row.is_current ? new Date() : enteredAt); 
    
    const timeSpent = exitedAt.getTime() - enteredAt.getTime();
    totalTimeMs += Math.max(0, timeSpent); 
  });

  return totalTimeMs;
}