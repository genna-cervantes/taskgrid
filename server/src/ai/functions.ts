import { OpenAI } from "openai";
import dotenv from "dotenv";
import { generateObject, ModelMessage } from "ai";
import z from "zod";
import { openai } from "@ai-sdk/openai";
import { InsertableTriageTask, Task, TriageTask } from "../shared/types.js";
import {
  EXTRACT_TASKS_FROM_FREE_TEXT_FOR_GENERATE_TASKS_SYSTEM_PROMPT,
  GENERATE_ASSIGNEE_SYSTEM_PROMPT,
  GENERATE_BASIC_TASK_FROM_SNIPPET_SYSTEM_PROMPT,
  GENERATE_CATEGORY_EVALUATION_SYSTEM_PROMPT,
  GENERATE_CATEGORY_SYSTEM_PROMPT,
  GENERATE_DEPENDENCY_EVALUATION_SYSTEM_PROMPT,
  GENERATE_DEPENDENCY_SYSTEM_PROMPT,
  GENERATE_DESCRIPTION_FEATURE_REQUIREMENTS_EVALUATION_SYSTEM_PROMPT,
  GENERATE_DESCRIPTION_FEATURE_REQUIREMENTS_SYSTEM_PROMPT,
} from "../lib/prompts.js";
import {
  getFilteredTasks,
  getSimilarTasks,
  getTaskCategoryOptions,
  getTaskEffortInMs,
} from "../db/queries/tasks.js";
import { pool } from "../db/db.js";
import {
  getUsersWithLatestTasks,
  getUsersWithWorkloadInProject,
} from "../db/queries/users.js";
import { getProjectDetails } from "../db/queries/projects.js";

dotenv.config();

export const OpenAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export const extractTasksFromFreeTextForGenerateTasks = async ({
  projectId,
  freeText,
}: {
  projectId: string;
  freeText: string;
}) => {
  const messages: ModelMessage[] = [];
  const startingPrompt = `{
    freeText: ${freeText}
  }`;
  messages.push({ role: "user", content: startingPrompt });

  const generatedSnippets = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      snippets: z.array(z.string()),
    }),
    messages: messages,
    system: EXTRACT_TASKS_FROM_FREE_TEXT_FOR_GENERATE_TASKS_SYSTEM_PROMPT,
  });

  return generatedSnippets.object;
}

export const generateBasicTaskFromSnippet = async ({
  projectId,
  snippet,
  categories,
  assignees,
}: {
  projectId: string;
  snippet: string;
  categories: string[];
  assignees: string[];
}) => {
  const messages: ModelMessage[] = [];
  const startingPrompt = `{
    snippet: ${JSON.stringify(snippet)}
    categories: ${JSON.stringify(categories)}
    assignees: ${JSON.stringify(assignees)}
  }`;
  messages.push({ role: "user", content: startingPrompt });

  const generatedBasicTask = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["low", "medium", "high"]),
      category: z.string(),
      assignTo: z.array(z.string()),
    }),
    messages: messages,
    system: GENERATE_BASIC_TASK_FROM_SNIPPET_SYSTEM_PROMPT,
  });

  return {...generatedBasicTask.object, category: generatedBasicTask.object.category === 'Uncategorized' ? undefined : generatedBasicTask.object.category};
}

export const generateCategory = async ({
  projectId,
  currentTask,
  projectCategories,
}: {
  projectId: string;
  currentTask: InsertableTriageTask;
  projectCategories: { category: string }[];
}): Promise<{ category: string | undefined; reasoning: string; tries: number }> => {
  let tries = 5;
  let feedback: any | null = null;
  const messages: ModelMessage[] = [];

  const startingPrompt = `{
        task: ${JSON.stringify(currentTask)},
        projectCategories: ${JSON.stringify(projectCategories)}
        feedback: ${JSON.stringify(feedback)}
  }`;
  messages.push({
    role: "user",
    content: startingPrompt,
  });

  while (tries > 0) {
    const generatedCategory = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        category: z.string(),
        reasoning: z.string(),
      }),
      messages: messages,
      system: GENERATE_CATEGORY_SYSTEM_PROMPT,
    });

    // const priorTasksInCategory = await getFilteredTasks(pool, "", "", generatedCategory.object.category, "", projectId);
    const priorTasksInCategory: any[] = [];
    messages.push({
      role: "user",
      content: `{
        task: ${JSON.stringify(currentTask)},
        projectCategories: ${JSON.stringify(projectCategories)},
        proposed: ${JSON.stringify(generatedCategory.object)},
        priorTasksInCategory: ${JSON.stringify(priorTasksInCategory)}
      }`,
    });

    const evaluation = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        category: z.string(),
        decision: z.enum(["accept", "reject"]),
        reasoning: z.string(),
        suggestedCategory: z.string().nullable(),
      }),
      messages: messages,
      system: GENERATE_CATEGORY_EVALUATION_SYSTEM_PROMPT,
    });

    if (evaluation.object.decision === "accept") {
      return { ...generatedCategory.object, tries };
    } else {
      messages.push({
        role: "user",
        content: `{
          task: ${JSON.stringify(currentTask)},
          projectCategories: ${JSON.stringify(projectCategories)},
          proposed: ${JSON.stringify(generatedCategory.object)},
          priorTasksInCategory: ${JSON.stringify(priorTasksInCategory)},
          feedback: ${JSON.stringify(evaluation.object)}
        }`,
      });

      feedback = evaluation.object;
      tries--;
      continue;
    }
  }

  return {
    category: undefined,
    reasoning: 'ran out of tries',
    tries,
  };
};

export const generateAssignee = async ({
  projectId,
  currentTask,
}: {
  projectId: string;
  currentTask: InsertableTriageTask;
}) => {
  // const usersWithWorkloadInProject = await getUsersWithWorkloadInProject(pool, projectId);
  // const usersWithLatestTasks = await getUsersWithLatestTasks(pool, projectId);
  const usersWithWorkloadInProject: any[] = [];
  const usersWithLatestTasks: any[] = [];

  const messages: ModelMessage[] = [];
  const startingPrompt = `{
    task: ${JSON.stringify(currentTask)},
    usersWithWorkloadInProject: ${JSON.stringify(usersWithWorkloadInProject)},
    usersWithLatestTasks: ${JSON.stringify(usersWithLatestTasks)}
  }`;
  messages.push({
    role: "user",
    content: startingPrompt,
  });

  const generatedAssignee = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      assignee: z.array(z.string()),
      reasoning: z.string(),
    }),
    messages: messages,
    system: GENERATE_ASSIGNEE_SYSTEM_PROMPT,
  });

  return generatedAssignee.object;
};

export const generateDescription = async ({
  projectId,
  currentTask,
}: {
  projectId: string;
  currentTask: InsertableTriageTask;
}) => {
  let generatedDescription = {
    description: '',
    reasoning: '',
  };
  const generatedDescriptionEstimatedEffort = await generateDescriptionEstimatedEffort({
    projectId,
    currentTask,
  })
  generatedDescription.description += `\nEstimated effort: ${generatedDescriptionEstimatedEffort.effortInHours} hours`;
  generatedDescription.reasoning += `\nEstimated effort reasoning: ${generatedDescriptionEstimatedEffort.reasoning}`;

  const generatedDescriptionFeatureRequirements = await generateDescriptionFeatureRequirements({
    projectId,
    currentTask,
  })
  generatedDescription.description += `\nFeature requirements: ${generatedDescriptionFeatureRequirements.featureRequirements.join(', ')}`;
  generatedDescription.reasoning += `\nFeature requirements reasoning: ${generatedDescriptionFeatureRequirements.reasoning}`;

  return generatedDescription;
}

const generateDescriptionEstimatedEffort = async ({
  projectId,
  currentTask,
}: {
  projectId: string;
  currentTask: InsertableTriageTask;
}) => {
  let referenceTasks: any[] = [];
  let reason = '';

  // effort estimation
  if (currentTask.assignTo.length > 0) {
    let similarAssigneeTasks: {
      id: string;
      title: string;
      description: string | undefined;
      priority: "low" | "medium" | "high";
      assign_to: string[];
    }[] = [];
    currentTask.assignTo.forEach(async (assignee) => {
      // embed current task
      const embedResult = await OpenAi.embeddings.create({
        model: "text-embedding-3-small",
        input: JSON.stringify(currentTask),
      });
      const embedding = embedResult.data[0].embedding;
      const vectorString = `[${embedding.join(",")}]`;
      
      let similarTasks = await getSimilarTasks(
        pool,
        projectId,
        vectorString,
        { assignTo: [assignee] },
        5
      );
      similarAssigneeTasks.push(...similarTasks);
    });
    referenceTasks = similarAssigneeTasks;
    reason = 'similar tasks assigned to the current assignee'
  }
  
  if (referenceTasks.length === 0) {
    // just get similar tasks
    const embedResult = await OpenAi.embeddings.create({
      model: "text-embedding-3-small",
      input: JSON.stringify(currentTask),
    });
    const embedding = embedResult.data[0].embedding;
    const vectorString = `[${embedding.join(",")}]`;
    const similarTasks = await getSimilarTasks(
      pool,
      projectId,
      vectorString,
      undefined,
      5
    );
    
    if (similarTasks[0]) {
      referenceTasks = similarTasks;
      reason = 'similar tasks across the project'
    } else {
      const assigneeTaskPromises = currentTask.assignTo.map((assignee) =>
        getFilteredTasks(pool, "", assignee, "", "", "", projectId, 5)
      );
      
      const assigneeTaskArrays = await Promise.all(assigneeTaskPromises);
      referenceTasks = assigneeTaskArrays.flat();
      reason = 'assigned to the current assignee'
    }
  }

  // average to do time
  const timePromises = referenceTasks.map((task) =>
    getTaskEffortInMs(pool, task.id)
  );
  const times = await Promise.all(timePromises);

  const totalTimeInMs = times.reduce((sum, time) => sum + time, 0);
  const totalTasks = referenceTasks.length;

  const averageTimeInMs = totalTasks > 0 ? totalTimeInMs / totalTasks : 0;

  return {
    effortInHours: averageTimeInMs,
    reasoning: averageTimeInMs > 0 ? `The estimated effort time is averaged from the ${totalTasks} previous tasks, all ${reason}.` : 'No estimate was inferred, not enough data.'
  };
};

const generateDescriptionFeatureRequirements = async ({
  projectId,
  currentTask,
}: {
  projectId: string;
  currentTask: InsertableTriageTask;
}) => {
  let {plan, ...projectContext} = await getProjectDetails(pool, projectId);
  
  let messages: ModelMessage[] = [];
  let startingPrompt = `{
    task: ${JSON.stringify(currentTask)},
    projectContext: ${JSON.stringify(projectContext)}
  }`;
  messages.push({ role: "user", content: startingPrompt });

  let tries = 5;
  while (tries > 0) {
    let generatedFeatureRequirements = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        featureRequirements: z.array(z.string()),
        reasoning: z.string(),
      }),
      system: GENERATE_DESCRIPTION_FEATURE_REQUIREMENTS_SYSTEM_PROMPT,
      messages: messages,
    });
    messages.push({ role: "user", content: `generatedFeatureRequirements: ${JSON.stringify(generatedFeatureRequirements.object)}` });
    console.log('generatedFeatureRequirements', generatedFeatureRequirements.object, );

    let evaluation = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        reasoning: z.string(),
        decision: z.enum(["accept", "reject"]),
      }),
      system: GENERATE_DESCRIPTION_FEATURE_REQUIREMENTS_EVALUATION_SYSTEM_PROMPT,
      messages: messages,
    });
    console.log('evaluation', evaluation.object);

    if (evaluation.object.decision === "accept") {
      return generatedFeatureRequirements.object;
    } else {
      messages.push({ role: "user", content: `evaluation: ${JSON.stringify(evaluation.object)}` });
      tries--;
    }
  }
  return {
    featureRequirements: [],
    reasoning: 'ran out of tries'
  };
}

export const generateDependency = async ({
  projectId,
  currentTask,
}: {
  projectId: string;
  currentTask: InsertableTriageTask;
}) => {
  let ongoingTasks = await getFilteredTasks(pool, "", "", "", "backlog,in progress,for checking", "", projectId, 5);
  
  let messages: ModelMessage[] = [];
  let startingPrompt = `{
    currentTask: ${JSON.stringify(currentTask)},
    ongoingTasks: ${JSON.stringify(ongoingTasks)}
    }`;
    messages.push({ role: "user", content: startingPrompt });
    
    let tries = 5;
    while (tries > 0) {
      let generatedDependency = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          dependency: z.array(z.string()),
          reasoning: z.string(),
        }),
        system: GENERATE_DEPENDENCY_SYSTEM_PROMPT,
        messages: messages,
      });
    
      messages.push({ role: "user", content: `
        generatedDependencies: ${JSON.stringify(generatedDependency.object)}
        ongoingTasks: ${JSON.stringify(ongoingTasks)}
    ` });
    
    let evaluation = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        reasoning: z.string(),
        decision: z.enum(["accept", "reject"]),
      }),
      system: GENERATE_DEPENDENCY_EVALUATION_SYSTEM_PROMPT,
      messages: messages,
    });

    if (evaluation.object.decision === "accept") {
      return generatedDependency.object;
    } else {
      messages.push({ role: "user", content: `evaluation: ${JSON.stringify(evaluation.object)}` });
      tries--;
    }
  }
  return {
    dependency: [],
    reasoning: 'ran out of tries'
  };
}