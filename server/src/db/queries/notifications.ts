import { Pool } from "pg"

export const insertAsyncNotification = async (pool:Pool, type: string, taskId: string, projectId: string, recipient: {recipient: string|number[]}, context: any) => {
    const query = 'INSERT INTO async_notifications (type, task_id, project_id, recipient, context) VALUES ($1, $2, $3, $4, $5);'
    const res = await pool.query(query, [type, taskId, projectId, recipient, context])
    
    return (res.rowCount ?? 0) === 1;
}

export const insertSyncNotification = async (pool: Pool, type: string, taskId: string, projectId: string, recipient: {recipient: string[]}, context: any) => {
    const query = 'INSERT INTO sync_notifications (type, task_id, project_id, recipient, context) VALUES ($1, $2, $3, $4, $5);'
    const res = await pool.query(query, [type, taskId, projectId, recipient, context])
    
    return (res.rowCount ?? 0) === 1;
}

export const getUnreadNotifications = async (pool: Pool, username: string, projectId: string) => {

    if (!username || !projectId) throw new Error("Bad request missing required fields")
    
    console.log('getting notifs')

    const query = `
    SELECT * FROM async_notifs 
    WHERE project_id = $1 AND ($2 = ANY(ARRAY(SELECT jsonb_array_elements_text(recipient->'recipient'))) 
                            OR recipient->>'recipient' = 'all')
    UNION ALL
    SELECT * FROM sync_notifs 
    WHERE project_id = $1 AND ($2 = ANY(ARRAY(SELECT jsonb_array_elements_text(recipient->'recipient'))) 
                            OR recipient->>'recipient' = 'all');
    `;
    const res = await pool.query(query, [projectId, username])

    console.log(res);
    return [];
}