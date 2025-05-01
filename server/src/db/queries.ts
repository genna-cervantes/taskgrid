import { Pool } from "pg";
import { InsertableTask, Task } from "../schemas/schemas.js";

export const getTasksFromProjectId = async (pool: Pool, id: string) => {
    const query = 'SELECT id, title, description, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId" FROM tasks WHERE project_id = $1';
    const res = await pool.query(query, [id]);
    const tasks = res.rows;

    return tasks as Task[];
}

export const insertTask = async (pool: Pool, task: InsertableTask, id: string) => {
    const query = 'INSERT INTO tasks (project_id, title, description, priority, progress, assign_to) VALUES ($1, $2, $3, $4, $5, $6);'
    const res = await pool.query(query, [id, task.title, task.description, task.priority, task.progress, task.assignedTo]);

    return res.rowCount;
}