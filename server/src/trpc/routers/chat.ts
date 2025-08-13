import express from "express";
import { openai } from "@ai-sdk/openai";
import { ModelMessage, generateObject, generateText, tool } from "ai";
import { z } from "zod";
import {
  GENERATE_TASK_SYSTEM_PROMPT,
  INFER_REQUEST_SYSTEM_PROMPT,
  TASKAN_SYSTEM_PROMPT,
} from "../../lib/prompts.js";
import {
  getTaskCategoryOptions,
  getTasksFromProjectId,
  insertTask,
} from "../../db/queries/tasks.js";
import { pool } from "../router.js";
import { getUsersInProject } from "../../db/queries/users.js";

export const chatRouter = express.Router();

const inferRequest = async ({ prompt }: { prompt: string }) => {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    prompt,
    system: INFER_REQUEST_SYSTEM_PROMPT,
    schemaName: "requestType",
    schemaDescription: "the types of request a user is requesting",
    schema: z.object({
      type: z.enum([
        "GENERATE_TASK",
        "QUERY_TASK",
        "UPDATE_TASK",
        "NOT_HANDLED",
      ]),
      prompt: z.string(),
    }),
  });

  return result.object;
};

const generateTask = async ({ messages }: { messages: ModelMessage[] }) => {
  const result = await generateObject({
    model: openai("gpt-4o"),
    messages,
    system: GENERATE_TASK_SYSTEM_PROMPT,
    schemaName: "tasks",
    schemaDescription: "tasks the user wants added to their project board",
    schema: z.object({tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional().nullable(),
      priority: z.enum(["low", "medium", "high"]),
      assignTo: z.array(z.string()),
      progress: z.string(),
      category: z.string().optional().nullable(), // has to be nullable unfortunately cause ai sdk sort of forces JSON just post process after
      dependsOn: z.array(z.object({id: z.string(), title: z.string()})),
      subtasks: z.array(z.object({title: z.string(), isDone: z.boolean()}))
    })),
    message: z.string()
    })
  });

  return result.object;
};

const messages: ModelMessage[] = [];

chatRouter.post("/", async (req, res) => {
  const projectId = req.body.projectId;
  const prompt = req.body.prompt;

  const inference = await inferRequest({ prompt });
  messages.push({ role: "user", content: prompt });

  let tomsg = ''
  if (inference.type === "GENERATE_TASK") {
    // get project specifications to inject to query
    const categoryOptions = await getTaskCategoryOptions(pool, projectId);
    messages.push({
      role: "system",
      content: `Here are the category options of this project, if this is empty DO NOT invent new ones for the tasks.  
        
        Category options:
        ${categoryOptions ? JSON.stringify(categoryOptions) : []}
        `,
    });

    const assignableUsers = await getUsersInProject(pool, projectId);
    messages.push({
      role: "system",
      content: `Here are the members and possible assignees of this project, if this is empty DO NOT invent new ones for the tasks.  
        
        Possible assignees:
        ${JSON.stringify(assignableUsers)}
        `,
    });
    const tasks = await getTasksFromProjectId(pool, projectId);
    messages.push({
      role: "system",
      content: `Here are all the previous tasks of this project, if this is empty DO NOT invent new ones. Try to follow the structure of these tasks.
        
        Previous tasks in project:
        ${JSON.stringify(tasks)}
        `,
    });
    
    // get task object from query
    let {message, tasks: tasksToAdd} = await generateTask({ messages });
    
    // post process tasks from generate task
    const postprocessedTasks = tasksToAdd.map((t) => ({
        ...t,
        category: t.category === null ? undefined : t.category,
        description: t.description === null ? undefined : t.description
    }))

    // insert to database
    await Promise.all(postprocessedTasks.map((ppt) => (
        insertTask(pool, ppt, projectId)
    )))

    tomsg = message;
    
    // message to the user
    messages.push({
      role: "assistant",
      content: message
    });    
  }

  res.send({
    message: {role: "ai", content: tomsg},
  });
});

// how to structure
