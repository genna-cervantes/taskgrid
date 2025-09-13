import { pool } from "../db/db.js";
import { getTaskCategoryOptions } from "../db/queries/tasks.js";
import { getUsersInProject } from "../db/queries/users.js";
import {
  extractTasksFromFreeTextForGenerateTasks,
  generateAssignee,
  generateBasicTaskFromSnippet,
  generateCategory,
  generateDependency,
  generateDescription,
} from "./functions.js";
import { tryCatch } from "../lib/utils.js";
import { getTriageTaskWithNoEnhancementById } from "../db/queries/triage.js";

export const generateTasksFromFreeText = async ({
  freeText,
  projectId,
}: {
  freeText: string;
  projectId: string;
}) => {
  const snippetsResult = await tryCatch(
    extractTasksFromFreeTextForGenerateTasks({ freeText, projectId })
  );
  if (snippetsResult.error != null) {
    console.error(snippetsResult.error);
    throw new Error(snippetsResult.error.message);
  }
  const snippets = snippetsResult.data;

  const taskCategoryOptionsResult = await tryCatch(
    getTaskCategoryOptions(pool, projectId)
  );
  if (taskCategoryOptionsResult.error != null) {
    console.error(taskCategoryOptionsResult.error);
    throw new Error(taskCategoryOptionsResult.error.message);
  }
  const taskCategoryOptions = taskCategoryOptionsResult.data;
  const categories = taskCategoryOptions.map((option) => option.category);

  const usersInProjectResult = await tryCatch(
    getUsersInProject(pool, projectId)
  );
  if (usersInProjectResult.error != null) {
    console.error(usersInProjectResult.error);
    throw new Error(usersInProjectResult.error.message);
  }
  const usersInProject = usersInProjectResult.data;
  const assignees = usersInProject.map((user) => user.username);

  const tasks = await Promise.all(
    snippets.snippets.map(async (snippet) => {
      return generateBasicTaskFromSnippet({
        snippet,
        projectId,
        categories,
        assignees,
      });
    })
  );

  return tasks;
};

export const enhanceTriageTask = async ({
  projectId,
  triageTaskId,
}: {
  projectId: string;
  triageTaskId: string;
}) => {
  const triageTaskResult = await tryCatch(
    getTriageTaskWithNoEnhancementById(pool, triageTaskId)
  );
  if (triageTaskResult.error != null) {
    console.error(triageTaskResult.error);
    throw new Error(triageTaskResult.error.message);
  }
  const triageTask = triageTaskResult.data;

  const taskCategoryOptionsResult = await tryCatch(
    getTaskCategoryOptions(pool, projectId)
  );
  if (taskCategoryOptionsResult.error != null) {
    console.error(taskCategoryOptionsResult.error);
    throw new Error(taskCategoryOptionsResult.error.message);
  }
  const taskCategoryOptions = taskCategoryOptionsResult.data;
  const projectCategories = taskCategoryOptions.map((option) => ({
    category: option.category,
  }));

  const generatedCategory = await generateCategory({
    projectId,
    currentTask: triageTask,
    projectCategories,
  });

  const generatedAssignee = await generateAssignee({
    projectId,
    currentTask: { ...triageTask, category: generatedCategory.category },
  });

  const generatedDescription = await generateDescription({
    projectId,
    currentTask: {
      ...triageTask,
      category: generatedCategory.category,
      assignTo: generatedAssignee.assignee,
    },
  });

  const generatedDependency = await generateDependency({
    projectId,
    currentTask: {
      ...triageTask,
      category: generatedCategory.category,
      assignTo: generatedAssignee.assignee,
      description: generatedDescription.description,
    },
  });

  // save to db
  return {
    ...triageTask,
    category: generatedCategory.category,
    assignTo: generatedAssignee.assignee,
    description: generatedDescription.description,
    dependsOn: generatedDependency.dependency,
  };
  // return to client
};
