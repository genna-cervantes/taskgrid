import { Pool } from "pg"

export const insertAsyncNotification = async (pool:Pool, type: string, taskId: string, projectId: string, recipient: {recipient: string|number[]}, context: any) => {
    const query = 'INSERT INTO async_notifications (type, task_id, project_id, recipient, context) VALUES ($1, $2, $3, $4, $5);'
    const res = await pool.query(query, [type, taskId, projectId, recipient, context])
    
    return (res.rowCount ?? 0) === 1;
}

export const insertSyncNotification = async (pool: Pool, type: string, taskId: string, projectId: string, recipient: {recipient: string[]}, context: any) => {
    const query = 'INSERT INTO sync_notifications (type, task_id, project_id, recipient, context) VALUES ($1, $2, $3, $4, $5) RETURNING id;'
    const res = await pool.query(query, [type, taskId, projectId, recipient, context])
    
    return (res.rowCount ?? 0) === 1 ? res.rows[0].id : null;
}

export const insertNotification = async (pool: Pool, type: string, projectId: string, recipient: {recipient: string[]}, title: string, message: string) => {
    const query = 'INSERT INTO notifications (type, project_id, recipient, title, message) VALUES ($1, $2, $3, $4, $5) RETURNING id;'
    const res = await pool.query(query, [type, projectId, recipient, title, message])
    
    return (res.rowCount ?? 0) === 1 ? res.rows[0].id : null;
}

export const getUnreadNotifications = async (pool: Pool, username: string, projectId: string) => {
    const query = `SELECT title, message FROM notifications WHERE project_id = $1 
    AND (
        recipient->'recipient' @> jsonb_build_array($2::text)
     OR recipient->>'recipient' = $2
     OR recipient->>'recipient' = 'all'
    )
    AND read = FALSE;`
    const res = await pool.query(query, [projectId, username])

    return res.rows as {
        title: string;
        message: string;
    }[];
}

export const getAllNotSentYetAsyncNotifications = async (pool: Pool) => {
    const query = 'SELECT id, type, task_id AS "taskId", project_id AS "projectId", recipient, context FROM async_notifications WHERE sent_at IS NULL;';
    const res = await pool.query(query)

    return res.rows as {
        id: string;
        type: string;
        taskId: string;
        projectId: string;
        recipient: {recipient: string[]};
        context: any;
    }[];
}

export const updateSentAt = async (pool: Pool, id: string) => {
    const query = 'UPDATE notifications SET sent_at = NOW() WHERE id = $1;';
    const res = await pool.query(query, [id])

    return (res.rowCount ?? 0) === 1;
}

export const updateRead = async (pool: Pool, id: string) => {
    const query = 'UPDATE notifications SET read = true WHERE id = $1;';
    const res = await pool.query(query, [id])

    return (res.rowCount ?? 0) === 1;
}