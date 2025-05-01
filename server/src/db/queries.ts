import { Pool } from "pg";
import { InsertableTask, Task } from "../schemas/schemas.js";

export const getTasksFromProjectId = async (pool: Pool, id: string) => {
    const query = 'SELECT id, title, description, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId" FROM tasks WHERE project_id = $1 AND is_active = TRUE';
    const res = await pool.query(query, [id]);

    const tasks: Task[] = res.rows.map((task) => ({
        ...task,
        id: task.id.toString(),
      }));

    return tasks as Task[];
}

export const insertTask = async (pool: Pool, task: InsertableTask, id: string) => {
    const query = 'INSERT INTO tasks (project_id, title, description, priority, progress, assign_to) VALUES ($1, $2, $3, $4, $5, $6);'
    const res = await pool.query(query, [id, task.title, task.description, task.priority, task.progress, task.assignedTo]);

    return res.rowCount;
}

export const updateTaskProgress = async (pool: Pool, taskId: string, progress: string) => {
    const query = 'UPDATE tasks SET progress = $1 WHERE id = $2 AND is_active = TRUE';
    const res = await pool.query(query, [progress, parseInt(taskId)]);

    return res.rowCount;
}

export const deleteTask = async (pool: Pool, taskId: string) => {
    const query = 'UPDATE tasks SET is_active = FALSE WHERE id = $1';
    const res = await pool.query(query, [taskId]);

    return res.rowCount
}

export const setUsername = async (pool: Pool, id: string, username: string) => {
    const query = 'INSERT INTO users (username, project_id) VALUES ($1, $2)';
    const res = await pool.query(query, [username, id]);

    return res.rowCount;
}

export const getUsersInProject = async (pool: Pool, id: string) => {
    const query = 'SELECT username FROM users WHERE project_id = $1 AND is_active = TRUE'
    const res = await pool.query(query, [id]);

    if (res.rowCount === 0){
        return []
    }

    let usernames = res.rows.map((r) => r.username)
    return usernames;
}