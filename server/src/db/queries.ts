import { Pool } from "pg";
import { InsertableTask, Project, Task } from "../shared/types.js";

export const getProjectsFromGuestId = async (pool: Pool, guestId: string) => {

    const query = "SELECT p.id, p.name, up.guest_id AS guestId FROM user_project_link AS up LEFT JOIN projects AS p ON p.id = up.project_id WHERE up.guest_id = $1 AND p.is_active = TRUE AND up.is_active = TRUE;";
    const res = await pool.query(query, [guestId])

    return res.rows as Project[]
}

export const getTasksFromProjectId = async (pool: Pool, id: string) => {
    const query = 'SELECT id, title, description, link, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId", files FROM tasks WHERE project_id = $1 AND is_active = TRUE';
    const res = await pool.query(query, [id]);

    const tasks: Task[] = res.rows.map((task) => ({
        ...task,
        id: task.id.toString(),
      }));

    return tasks as Task[];
}

export const insertTask = async (pool: Pool, task: InsertableTask, id: string) => {
    const query = 'INSERT INTO tasks (project_id, title, link, description, priority, progress, assign_to) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, description, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId";'
    const res = await pool.query(query, [id, task.title, task.link, task.description, task.priority, task.progress, task.assignedTo]);

    res.rows[0].id = res.rows[0].id.toString()

    return res.rows[0] as Task;
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

export const insertUser = async (pool: Pool, username: string, guestId: string) => {
    const query = 'INSERT INTO users (username, guest_id) VALUES ($1, $2)';
    const res = await pool.query(query, [username, guestId]);

    return res.rowCount;
}

export const setUsername = async (pool:Pool, username: string, guestId: string, id: string) => {
    const query = 'UPDATE user_project_link SET username = $1 WHERE guest_id = $2 AND project_id = $3 AND is_active = TRUE;';
    const res = await pool.query(query, [username, guestId, id]);
    
    return res.rowCount;
}

export const checkGuestId = async (pool: Pool, guestId: string) => {
    const query = 'SELECT COUNT(*) FROM users WHERE guest_id = $1 AND is_active = TRUE;';
    const res = await pool.query(query, [guestId]);

    return parseInt(res.rows[0].count);
}

export const getUsername = async (pool: Pool, id: string, guestId: string) => {
    const query = 'SELECT username FROM user_project_link WHERE project_id = $1 AND guest_id = $2 AND is_active = TRUE'
    const res = await pool.query(query, [id, guestId])

    return res.rows[0]?.username ?? ""
}

export const kickUserFromProject = async (pool: Pool, id: string, guestId: string) => {
    const query = 'UPDATE user_project_link SET is_active = FALSE WHERE project_id = $1 AND guest_id = $2;';
    const res = await pool.query(query, [id, guestId]);

    return res.rowCount;
}

export const getUsersInProject = async (pool: Pool, id: string) => {
    const query = 'SELECT username, guest_id AS guestId FROM user_project_link WHERE project_id = $1 AND is_active = TRUE;';
    const res = await pool.query(query, [id])

    if (res.rowCount === 0){
        return []
    }

    let users = res.rows.map((r) => {
        return {
            username: r.username,
            guestId: r.guestid
        }
    })

    return users;
}

export const getUsernamesInProject = async (pool: Pool, id: string) => {
    const query = 'SELECT username FROM user_project_link WHERE project_id = $1 AND is_active = TRUE'
    const res = await pool.query(query, [id]);

    if (res.rowCount === 0){
        return []
    }

    let usernames = res.rows.map((r) => r.username)
    return usernames;
}

export const updateAssignedTo = async (pool: Pool, taskId: string, assignTo: string[]) => {
    const query = 'UPDATE tasks SET assign_to = $1 WHERE id = $2 AND is_active = TRUE';
    const res = await pool.query(query, [assignTo, taskId])

    return res.rowCount;
}

export const updateTaskTitle = async (pool: Pool, taskId: string, title: string) => {
    const query = 'UPDATE tasks SET title = $1 WHERE id = $2 AND is_active = TRUE';
    const res = await pool.query(query, [title, taskId]);

    return res.rowCount;
}

export const updateTaskDescription = async (pool: Pool, taskId: string, description?: string) => {
    const query = 'UPDATE tasks SET description = $1 WHERE id = $2 AND is_active = TRUE';
    const res = await pool.query(query, [description, taskId])

    return res.rowCount;
}

export const updateTaskLink = async (pool: Pool, taskId: string, link?: string) => {
    const query = 'UPDATE tasks SET link = $1 WHERE id = $2 AND is_active = TRUE';
    const res = await pool.query(query, [link, taskId])

    return res.rowCount;
}


export const updateTaskPriority = async (pool: Pool, taskId: string, priority: string) => {
    const query = 'UPDATE tasks SET priority = $1 WHERE id = $2 AND is_active = TRUE';
    const res = await pool.query(query, [priority, taskId]);

    return res.rowCount;
}

export const updateTaskFiles = async (pool: Pool, taskId: string, projectId: string, keys: string[], previousKeys: string[]) => {
    if ((keys.length + previousKeys.length) > 3){
        throw new Error("too many task files")
    }

    const query = 'UPDATE tasks SET files = $1 WHERE id = $2 AND project_id = $3 AND is_active = TRUE;';
    const res = await pool.query(query, [[...keys, ...previousKeys], taskId, projectId]);

    return res.rowCount;
}

export const deleteTaskById = async (pool: Pool, taskId: string) => {
    const query = 'UPDATE tasks SET is_active = FALSE WHERE id = $1 AND is_active = TRUE';
    const res = await pool.query(query, [taskId])

    return res.rowCount;
}

export const undoDeleteTask = async (pool: Pool, taskId: string) => {
    const query = 'UPDATE tasks SET is_active = TRUE WHERE id = $1';
    const res = await pool.query(query, [taskId])

    return res.rowCount;
}

export const addProject = async (pool: Pool, projectId: string, name: string, guestId: string) => {
    const query = 'INSERT INTO projects (id, name, guest_id) VALUES ($1, $2, $3)';
    const res = await pool.query(query, [projectId, name, guestId]);

    return res.rowCount;
}

export const getProjectOwner = async (pool: Pool, projectId: string) => {
    const query = 'SELECT guest_id FROM projects WHERE id = $1 AND is_active = TRUE;';
    const res = await pool.query(query, [projectId]);

    return res.rows[0]?.guest_id;
}

export const addUserProjectLink = async (pool: Pool, projectId: string, guestId: string, username: string) => {
    const query = 'INSERT INTO user_project_link (project_id, guest_id, username) VALUES ($1, $2, $3);';
    const res = await pool.query(query, [projectId, guestId, username]);

    return res.rowCount;
}

export const editProjectName = async (pool: Pool, projectId: string, name: string, guestId: string) => {
    const query = 'UPDATE projects SET name = $1 WHERE id = $2 AND guest_id = $3 AND is_active = TRUE';
    const res = await pool.query(query, [name, projectId, guestId]);

    return res.rowCount;
}

export const getProjectNameByKey = async (pool: Pool, id: string) => {
    const query = 'SELECT name FROM projects WHERE id = $1 AND is_active = TRUE';
    const res = await pool.query(query, [id]);

    return res.rows[0]?.name;
}

export const deleteProject = async (pool: Pool, id: string, guestId: string) => {
    const query = 'UPDATE projects SET is_active = FALSE WHERE id = $1 AND guest_id = $2 AND is_active = TRUE;';
    const res = await pool.query(query, [id, guestId])

    return res.rowCount;
}

export const deleteUserProjectLink = async (pool: Pool, id: string, guestId: string) => {
    const query = 'UPDATE user_project_link SET is_active = FALSE WHERE project_id = $1 AND guest_id = $2 AND is_active = TRUE;';
    const res = await pool.query(query, [id, guestId])
    
    return res.rowCount;
}

export const getFilteredTasks = async (pool: Pool, priority: string, assignedTo: string, projectId: string) => {
    
    let query = "";
    let res;

    if (priority !== "" && assignedTo !== ""){
        query = 'SELECT id, title, description, link, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId" FROM tasks WHERE priority = $1 AND $2 = ANY(assign_to) AND project_id = $3 AND is_active = TRUE';
        res = await pool.query(query, [priority, assignedTo, projectId]);
    }else if (priority !== "" && assignedTo == ""){
        query = 'SELECT id, title, description, link, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId" FROM tasks WHERE priority = $1 AND project_id = $2 AND is_active = TRUE'
        res = await pool.query(query, [priority, projectId])
    }else if (priority == "" && assignedTo !== ""){
        query = 'SELECT id, title, description, link, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId" FROM tasks WHERE $1 = ANY(assign_to) AND project_id = $2 AND is_active = TRUE'
        res = await pool.query(query, [assignedTo, projectId]);
    }else{
        query = 'SELECT id, title, description, link, priority, progress, assign_to AS "assignedTo", project_task_id AS "projectTaskId" FROM tasks WHERE project_id = $1 AND is_active = TRUE'
        res = await pool.query(query, [projectId])
    }

    const tasks: Task[] = res.rows.map((task) => ({
        ...task,
        id: task.id.toString(),
      }));

    return tasks as Task[];   
}

export const archiveTasksInColumn = async (pool: Pool, id: string, column: string) => {
    const query = "UPDATE tasks SET is_active = False WHERE project_id = $1 AND progress = $2 AND is_active = TRUE;";
    const res = await pool.query(query, [id, column]);

    return res.rowCount;
}