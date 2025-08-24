import { Pool } from "pg"

export const insertAsyncNotification = async (pool:Pool, type: string, taskId: string, projectId: string, recipient: {recipient: string|number[]}, context: any) => {
    const query = 'INSERT INTO async_notifications (type, task_id, project_id, recipient, context) VALUES ($1, $2, $3, $4, $5);'
    const res = await pool.query(query, [type, taskId, projectId, recipient, context])

    return (res.rowCount ?? 0) === 1;
}