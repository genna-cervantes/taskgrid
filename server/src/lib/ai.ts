import { OpenAI } from 'openai';
import dotenv from "dotenv";
import { generateObject, ModelMessage } from 'ai';
import z from 'zod';
import { openai } from "@ai-sdk/openai";
import { Task } from '../shared/types.js';
import { GENERATE_ASSIGNEE_SYSTEM_PROMPT, GENERATE_CATEGORY_EVALUATION_SYSTEM_PROMPT, GENERATE_CATEGORY_SYSTEM_PROMPT } from './prompts.js';
import { getFilteredTasks } from '../db/queries/tasks.js';
import { pool } from '../db/db.js';
import { getUsersWithLatestTasks, getUsersWithWorkloadInProject } from '../db/queries/users.js';

dotenv.config();

export const OpenAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const generateCategory = async ({projectId, currentTask, projectCategories}: {projectId: string, currentTask: Pick<Task, "title" | "description" | "priority" | "assignTo" | "progress" | "dependsOn" | "subtasks">, projectCategories: {category: string}[]}) => {
  
  let tries = 5;
  let feedback: any | null = null;
  const messages: ModelMessage[] = []

  const startingPrompt = `{
        task: ${JSON.stringify(currentTask)},
        projectCategories: ${JSON.stringify(projectCategories)}
        feedback: ${JSON.stringify(feedback)}
  }`
  messages.push({
    role: "user",
    content: startingPrompt,
  })

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
    })
    console.log(generatedCategory.object);

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
      }
    )

    if (evaluation.object.decision === "accept") {
      return {...generatedCategory.object, tries};
    }else{
      console.log(evaluation.object);
      messages.push({
        role: "user",
        content: `{
          task: ${JSON.stringify(currentTask)},
          projectCategories: ${JSON.stringify(projectCategories)},
          proposed: ${JSON.stringify(generatedCategory.object)},
          priorTasksInCategory: ${JSON.stringify(priorTasksInCategory)},
          feedback: ${JSON.stringify(evaluation.object)}
        }`,
      })

      feedback = evaluation.object;
      tries--;
      continue; 
    }
  }

  return 'ran out of tries';
}

const generateAssignee = async ({projectId, currentTask}: {projectId: string, currentTask: Pick<Task, "title" | "description" | "priority" | "assignTo" | "progress" | "dependsOn" | "subtasks">}) => {
  
  const usersWithWorkloadInProject = await getUsersWithWorkloadInProject(pool, projectId);
  const usersWithLatestTasks = await getUsersWithLatestTasks(pool, projectId);

  const messages: ModelMessage[] = []
  const startingPrompt = `{
    task: ${JSON.stringify(currentTask)},
    usersWithWorkloadInProject: ${JSON.stringify(usersWithWorkloadInProject)},
    usersWithLatestTasks: ${JSON.stringify(usersWithLatestTasks)}
  }`
  messages.push({
  role: "user",
  content: startingPrompt,
  })
  
  const generatedAssignee = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      assignee: z.string(),
      reasoning: z.string(),
    }),
    messages: messages,
    system: GENERATE_ASSIGNEE_SYSTEM_PROMPT
  })

  return generatedAssignee.object;
}

const assignee = await generateAssignee({
  projectId: "1",
  currentTask: {
    title: "Optimize React performance for large dataset visualization",
    description: "The dashboard is rendering 10k+ data points causing severe performance issues. Need to implement virtualization, memoization, and potentially Web Workers for data processing. Also requires integration with existing GraphQL subscriptions for real-time updates.",
    priority: "medium",
    assignTo: [],
    progress: "backlog", 
    dependsOn: [
      { id: "TASK-445", title: "GraphQL subscription refactoring" }
    ],
    subtasks: [
      { title: "Profile current performance bottlenecks", isDone: false },
      { title: "Implement virtual scrolling", isDone: false },
      { title: "Add React.memo and useMemo optimizations", isDone: false },
      { title: "Integrate with GraphQL real-time data", isDone: false }
    ]
  }
});

console.log(JSON.stringify(assignee));