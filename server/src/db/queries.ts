import { Pool } from "pg";
import { Task } from "../schemas/schemas.js";

export const getTasksFromProjectId = async (pool: Pool, id: string) => {
    const query = 'SELECT * FROM tasks WHERE project_id = $1';
    const res = await pool.query(query, [id]);
    const tasks = res.rows;

    console.log(tasks)

    return tasks as Task[];
}