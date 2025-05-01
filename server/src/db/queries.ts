import { Pool } from "pg";
import { Task } from "../schemas/schemas.js";

export const getTasksFromProjectId = async (pool: Pool, id: string) => {
    const query = 'SELECT id, title, description, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId" FROM tasks WHERE project_id = $1';
    const res = await pool.query(query, [id]);
    const tasks = res.rows;

    console.log(tasks)

    return tasks as Task[];
}