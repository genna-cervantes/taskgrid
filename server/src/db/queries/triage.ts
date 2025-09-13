import { Pool } from "pg";
import { InsertableTriageTask, TriageTask } from "../../shared/types.js";

export const insertTriageTask = async (pool: Pool, task: InsertableTriageTask, projectId: string) => {
    if (!projectId || !task) throw new Error("Bad request missing required fields");
    
    const query = `INSERT INTO triage_tasks (project_id, title, description, priority, assign_to, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`;
    const res = await pool.query(query, [projectId, task.title, task.description, task.priority, task.assignTo, task.category]);

    if (res.rowCount !== 1) throw new Error("Bad request query returned no id");

    return res.rows[0].id as string;
}

export const getTriageTasks = async (pool: Pool, projectId: string) => {
    if (!projectId) throw new Error("Bad request missing required fields");

    const query = `SELECT id, title, description, priority, assign_to AS "assignTo", category, depends_on AS "dependsOn", subtasks, 
    enhanced_description AS "enhancedDescription", enhanced_priority AS "enhancedPriority", enhanced_assign_to AS "enhancedAssignTo", 
    enhanced_category AS "enhancedCategory", enhanced_depends_on AS "enhancedDependsOn", enhanced_subtasks AS "enhancedSubtasks", 
    enhance_status AS "enhanceStatus" FROM triage_tasks WHERE project_id = $1 AND is_active = TRUE;`;

    const res = await pool.query(query, [projectId]);
    const tasks: TriageTask[] = res.rows.map((row) => ({
        ...row,
        category: row.category === null ? undefined : row.category
    }));

    return tasks;
}

export const getTriageTaskWithNoEnhancementById = async (pool: Pool, triageTaskId: string) => {
    if (!triageTaskId) throw new Error("Bad request missing required fields");

    const query = `SELECT id, title, description, priority, assign_to AS "assignTo", category, depends_on AS "dependsOn", subtasks
    FROM triage_tasks WHERE id = $1 AND is_active = TRUE AND enhance_status = ANY('{"not_proposed", "enhancing", "rejected"}');`;
    const res = await pool.query(query, [triageTaskId]);

    if (res.rows.length === 0) throw new Error("Triage task not found");

    return {...res.rows[0], category: res.rows[0].category === null ? undefined : res.rows[0].category} as InsertableTriageTask;
}

export const updateTriageTask = async (pool: Pool, triageTask: TriageTask, projectId: string) => {
    if (!projectId || !triageTask) throw new Error("Bad request missing required fields");

    const query = `UPDATE triage_tasks SET enhanced_category = $1, enhanced_description = $2, enhanced_assign_to = $3, enhanced_depends_on = $4, enhance_status = $5 WHERE id = $6 AND project_id = $7;`;
    const res = await pool.query(query, [triageTask.enhancedCategory, triageTask.enhancedDescription, triageTask.enhancedAssignTo, triageTask.enhancedDependsOn, triageTask.enhanceStatus, triageTask.id, projectId]);

    return (res.rowCount ?? 0) === 1;
}