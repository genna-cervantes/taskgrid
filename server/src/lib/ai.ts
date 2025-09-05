import { OpenAI } from 'openai';
import dotenv from "dotenv";
import { generateObject, ModelMessage } from 'ai';
import z from 'zod';
import { openai } from "@ai-sdk/openai";
import { Task } from '../shared/types.js';
import { GENERATE_CATEGORY_EVALUATION_SYSTEM_PROMPT, GENERATE_CATEGORY_SYSTEM_PROMPT } from './prompts.js';
import { getFilteredTasks } from '../db/queries/tasks.js';
import { pool } from '../db/db.js';

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

const category = await generateCategory({
  projectId: "1",
  currentTask: {
    title: "How to count tokens before sending to streamText (by provider",
    description: `
  Description
Hi, is there an official way in ai sdk to count tokens of the full messages + tools payload so we can manage context window limit before sending request to streamText?

Does it support different providers? Would be amazing to have as this util is essential for managing agentic use cases across steps.

AI SDK Version
ai 5.x.x
ai-sdk/openai 2.x.x
Code of Conduct

I agree to follow this project's Code of Conduct
    `,
    priority: "medium",
    assignTo: ["John Doe"],
    progress: "backlog",
    dependsOn: [],
    subtasks: [],
  },
  projectCategories: [
    { category: "bug" },
    { category: "documentation" },
    { category: "duplicate" },
    { category: "enhancement" },
    { category: "good first issue" },
    { category: "help wanted" },
    { category: "in progress" },
    { category: "invalid" },
    { category: "question" },
    { category: "wontfix" }
  ]
});

console.log(JSON.stringify(category));