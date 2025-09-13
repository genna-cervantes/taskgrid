import express from "express";
import { enhanceTriageTask, generateTasksFromFreeText } from "./workflows.js";
import { pool } from "../db/db.js";
import { getTriageTaskWithNoEnhancementById, insertTriageTask, updateTriageTask } from "../db/queries/triage.js";
import { InsertableTriageTask, ProjectDetailsSchema } from "../shared/types.js";
import { tryCatch } from "../lib/utils.js";
import { generateCategory, generateAssignee, generateDependency, generateDescription } from "./functions.js";
import { getTaskCategoryOptions } from "../db/queries/tasks.js";

export const aiWorkflowsRouter = express.Router();

aiWorkflowsRouter.post("/triage/tasks/generate", async (req, res) => {

  console.log('generate tasks from free text');

  const { projectId, freeText } = req.body;
  if (!projectId || !freeText) {
    res.write(JSON.stringify({ error: 'projectId and freeText are required.' }) + '\n');
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  try{
    const tasksResult = await tryCatch(generateTasksFromFreeText({ projectId, freeText }));
    if (tasksResult.error != null) {
      console.error(tasksResult.error);
      throw new Error(tasksResult.error.message);
    }
    const tasks = tasksResult.data;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      const result = await tryCatch(insertTriageTask(pool, task, projectId));
      if (result.error != null) {
        console.error(result.error);
        res.write(JSON.stringify({ error: 'Internal server error' }) + '\n');
        res.end();
        return;
      }

      res.write(JSON.stringify({...task, id: result.data}) + '\n');
    };
  }catch(err){
    console.error(err);
    res.write(JSON.stringify({ error: 'Internal server error' }) + '\n');
    res.end();
  }
  
  res.end();
});

aiWorkflowsRouter.post("/triage/tasks/enhance", async (req, res) => {
  const { projectId, triageTaskId } = req.body;

  if (!projectId || !triageTaskId) {
    res.write(JSON.stringify({ error: 'projectId and triageTaskId are required.' }) + '\n');
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const triageTaskResult = await tryCatch(
    getTriageTaskWithNoEnhancementById(pool, triageTaskId)
  );
  if (triageTaskResult.error != null) {
    console.error(triageTaskResult.error);
    res.write(JSON.stringify({ error: 'Internal server error' }) + '\n');
    res.end();
    return;
  }
  const triageTask = triageTaskResult.data;

  const taskCategoryOptionsResult = await tryCatch(
    getTaskCategoryOptions(pool, projectId)
  );
  if (taskCategoryOptionsResult.error != null) {
    console.error(taskCategoryOptionsResult.error);
    res.write(JSON.stringify({ error: 'Internal server error' }) + '\n');
    res.end();
    return;
  }
  const taskCategoryOptions = taskCategoryOptionsResult.data;
  const projectCategories = taskCategoryOptions.map((option) => ({
    category: option.category,
  }));

  res.write(JSON.stringify({state: 'Generating Category'}) + '\n');
  const generatedCategory = await generateCategory({
    projectId,
    currentTask: triageTask,
    projectCategories,
  });
  
  res.write(JSON.stringify({state: 'Generating Assignee'}) + '\n');
  const generatedAssignee = await generateAssignee({
    projectId,
    currentTask: { ...triageTask, category: generatedCategory.category },
  });
  
  res.write(JSON.stringify({state: 'Generating Description'}) + '\n');
  const generatedDescription = await generateDescription({
    projectId,
    currentTask: {
      ...triageTask,
      category: generatedCategory.category,
      assignTo: generatedAssignee.assignee,
    },
  });
  
  res.write(JSON.stringify({state: 'Generating Dependency'}) + '\n');
  const generatedDependency = await generateDependency({
    projectId,
    currentTask: {
      ...triageTask,
      category: generatedCategory.category,
      assignTo: generatedAssignee.assignee,
      description: generatedDescription.description,
    },
  });

  console.log({
      ...triageTask,
      category: generatedCategory.category,
      assignTo: generatedAssignee.assignee,
      description: generatedDescription.description,
      dependsOn: generatedDependency.dependency,
    })

  
  const result = await tryCatch(updateTriageTask(pool, {
    ...triageTask,
    id: triageTaskId,
    enhancedCategory: generatedCategory.category,
    enhancedAssignTo: generatedAssignee.assignee,
    enhancedPriority: triageTask.priority,
    enhancedDescription: generatedDescription.description,
    enhancedDependsOn: [],
    enhanceStatus: 'proposed',
    dependsOn: [],
    subtasks: [],
    enhancedSubtasks: []
  }, projectId));
  
  if (result.error != null) {
    console.error(result.error);
    res.write(JSON.stringify({ error: 'Internal server error' }) + '\n');
    res.end();
    return;
  }
  

  // await tryCatch(updateTriageTask(pool, {
  //   ...triageTask,
  //   category: generatedCategory.category,
  //   assignTo: generatedAssignee.assignee,
  //   description: generatedDescription.description,
  //   dependsOn: generatedDependency.dependency,
  // }, projectId));


  res.write(JSON.stringify({state: 'done'}) + '\n'); 
  res.end();
})