import express, { Response } from "express";
import { openai } from "@ai-sdk/openai";
import { ModelMessage, generateObject, generateText, stepCountIs, streamObject, streamText, tool } from "ai";
import { z } from "zod";
import {
  GENERATE_TASK_MESSAGE_SYSTEM_PROMPT,
  GENERATE_TASK_SYSTEM_PROMPT,
  INFER_REQUEST_SYSTEM_PROMPT,
  MAKE_PLAN_SYSTEM_PROMPT,
  TASKAN_SYSTEM_PROMPT,
} from "../../lib/prompts.js";
import {
  addTaskCategoryOptions,
  getSimilarTasks,
  getTaskCategoryOptions,
  getTasksFromProjectId,
  insertTask,
} from "../../db/queries/tasks.js";
import { pool } from "../router.js";
import { getUsersInProject } from "../../db/queries/users.js";
import { tryCatch } from "../../lib/utils.js";
import { AddTask } from "../../shared/types.js";
import { OpenAi } from "../../lib/openai.js";

// cant stream if trpc 

export const chatRouter = express.Router();

// understand prompt
const makePlan = async ({prompt, res}: {prompt: string, res: any}) => {

  let jobQueue: {type: string, context: string}[] = []

  const {textStream} = streamText({
    model: openai("gpt-4o"),
    prompt,
    system: MAKE_PLAN_SYSTEM_PROMPT,
    tools: {
      queueGenerateTask: tool({
        description: `Tool for generating a new task, used when the user prompt indicates the creation of ONE OR MORE tasks.
        Required input is an object with parameter context: string, which must be the exact portion of the prompt INCLUDING RELEVANT CONTEXT that triggered this tool call.
         `,
        inputSchema: z.object({
          context: z.string(),
        }),
        execute: async ({context}) => {
          jobQueue.push({
            type: "generateTask",
            context
          })

          return true;
        }
      }),
      queueQueryTask: tool({
        description: `Tool for querying about ONE OR MORE tasks, used when the user prompt indicates querying or asking about ONE OR MORE tasks.
        Required input is an object with parameter context: string, which must be the exact portion of the prompt INCLUDING RELEVANT CONTEXT that triggered this tool call.
        `,
        inputSchema: z.object({
          context: z.string(),
        }),
        execute: async ({context}) => {
          jobQueue.push({
            type: "queryTask",
            context
          })

          return true;
        }
      }),
      queueUpdateTask: tool({
        description: `Tool for updating ONE OR MORE tasks, used when the user prompt indicates updating ONE OR MORE tasks.
        Required input is an object with parameter context: string, which must be the exact portion of the prompt INCLUDING RELEVANT CONTEXT that triggered this tool call.
        `,
        inputSchema: z.object({
          context: z.string(),
        }),
        execute: async ({context}) => {
          jobQueue.push({
            type: "updateTask",
            context
          })
          
          return true;
        }
      })
    },
    stopWhen: stepCountIs(10) // possible multiple tasks eh
  })

  for await (const delta of textStream) {
    res.write(`data: ${JSON.stringify(delta)}\n\n`); 
  }

  return jobQueue;
}

// enhance prompt as well
const inferRequest = async ({ prompt, res }: { prompt: string, res: any }) => {
  const {partialObjectStream} = await streamObject({
    model: openai("gpt-4o"),
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
  
  for await (const partialObject of partialObjectStream) {
    res.write(`data: ${JSON.stringify(partialObject)}\n\n`); 
  }
};

const generateTask = async ({ messages, projectId }: { messages: ModelMessage[], projectId: string }) => {
  const {text, steps} = await generateText({
    model: openai("gpt-4o"),
    messages,
    system: GENERATE_TASK_SYSTEM_PROMPT,
    tools: {
      createCategoryOption: tool({
        description: `Tool for adding task category option, used when category options is empty or no category option is 
        fit for the current task.  This inserts only one category at a time. Required input is an object with parameter
        categoryOption which is an object with parameters category: string and color: string.  
        In the event that category options is not empty and this tool is called, the color assigned should not be the 
        same as any of the current task category options
        
        Expected output when tool call is successful if an object {category: string, color: string}, use the category for 
        the task.  The output when tool call is NOT successful is an object {error: string}, in this event set category as
        NULL instead.
         `,
        inputSchema: z.object({
          categoryOption: z.object({
            category: z.string(),
            color: z.enum(['red', 'orange', 'lime', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink', 'rose'])
          })
        }),
        execute: async ({categoryOption}) => {
          const result = await tryCatch(addTaskCategoryOptions(pool, projectId, categoryOption))
          if (result.error){
            return {
              error: `unable to add category option due to ${result.error}`
            }
          }
          if (!result.data){
            return {
              error: `unable to add category option due to ${result.error}`
            }
          }

          return result.data
        }
      })
    },
    stopWhen: stepCountIs(10) // possible multiple tasks eh
  });

  return {text, steps};
};

const generateTaskMessage = async ({messages}: {messages: ModelMessage[]}) => {
  const text = generateText({
    model: openai('gpt-4o-mini'),
    messages,
    system: GENERATE_TASK_MESSAGE_SYSTEM_PROMPT
  })

  return text;
}

const messages: ModelMessage[] = [];

chatRouter.post("/", async (req, res) => {

  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // get necessary data
  const projectId = req.body.projectId;
  const prompt = req.body.prompt;

  const jobQueue = await makePlan({ prompt, res });
  console.log(jobQueue);
  res.end();

  res.on('close', () => {
      console.log('client dropped me');
      res.end();
  });
})

// chatRouter.post("/", async (req, res) => {
//   const projectId = req.body.projectId;
//   const prompt = req.body.prompt;

//   const inference = await inferRequest({ prompt });
//   messages.push({ role: "user", content: prompt });

//   if (inference.type === "GENERATE_TASK") {
//     console.log('generating')

//     // add necessary context
//     messages.push(...(await Promise.all([getCategoryOptionsMessage(projectId), getAssignableUsersMessage(projectId), getPreviousTasksMessage(projectId)])))
    
//     // get task object from llm call
//     let {text: returnText, steps} = await generateTask({ messages, projectId });
//     // console.log('steps', JSON.stringify(steps))
//     let parsedText = JSON.parse(returnText);
//     let tasksToAdd: AddTask[] = parsedText.tasks
    
//     // post process tasks from generate task
//     const postprocessedTasks = tasksToAdd.map((t) => ({
//         ...t,
//         category: t.category === null ? undefined : t.category,
//         description: t.description === null ? undefined : t.description
//     }))

//     let duplicateTasks: {
//       skippedTask: {
//           title: string;
//           description: string | undefined;
//           priority: "low" | "medium" | "high";
//           assign_to: string[];
//       },
//       duplicateTaskTitle: string
//     }[] = []
//     const uniqueTasks = (
//       await Promise.all(postprocessedTasks.map(async (ppt) => {
//         const embedResult = await OpenAi.embeddings.create({
//           model: 'text-embedding-3-small',
//           input: JSON.stringify(ppt)
//         });
//         const embedding = embedResult.data[0].embedding;
//         const vectorString = `[${embedding.join(',')}]`;

//         console.log(ppt.title)
//         console.log(vectorString)

//         const duplicateTask = await getSimilarTasks(pool, projectId, vectorString);
//         if (duplicateTask){
//           duplicateTasks.push({skippedTask: duplicateTask, duplicateTaskTitle: duplicateTask.title})
//         }else{
//           return ppt
//         }
//       }))
//     ).filter(result => !!result);

//     // insert to database
//     await Promise.all(uniqueTasks.map((ppt) => (
//         insertTask(pool, ppt, projectId)
//     )))

//     // message to the user
//     messages.push({
//       role: "system",
//       content: `The following are the tasks skipped because they have existing very similar tasks on the board.  The structure
//       is {skippedTask: duplicateTask, duplicateTaskTitle: duplicateTask.title} where skippedTask is the skipped task and 
//       duplicateTaskTitle is the title of the already existing similar task on the board.  If this is empty this means there are
//       no skipped tasks.
      
//       Skipped tasks:
//       ${JSON.stringify(duplicateTasks)}
//       `
//     })

//     messages.push({
//       role: "system",
//       content: `The following are the tasks added to the board.
      
//       Added tasks:
//       ${JSON.stringify(uniqueTasks)}
//       `
//     })

//     const message = await generateTaskMessage({messages})
//     messages.push({
//       role: "assistant",
//       content: message
//     });    
//   }

//   res.send({
//     message: {role: "ai", content: messages[messages.length - 1].content},
//   });
// });

// // get project specifications to inject to query
// const getCategoryOptionsMessage = async (projectId: string): Promise<ModelMessage> => {
//   const categoryOptions = await getTaskCategoryOptions(pool, projectId);
//   return {
//     role: "system",
//     content: `Here are the category options of this project, if this is empty DO NOT invent new ones for the tasks.  
      
//       Category options:
//       ${categoryOptions ? JSON.stringify(categoryOptions) : []}
//       `,
//   };
// }

// // get assignable users
// const getAssignableUsersMessage = async (projectId: string): Promise<ModelMessage> => {
//   const assignableUsers = await getUsersInProject(pool, projectId);
//   return{
//     role: "system",
//     content: `Here are the members and possible assignees of this project, if this is empty DO NOT invent new ones for the tasks.  
      
//       Possible assignees:
//       ${JSON.stringify(assignableUsers)}
//       `,
//   };
// }

// // get all previous tasks
// const getPreviousTasksMessage = async (projectId: string): Promise<ModelMessage> => {
//   const tasks = await getTasksFromProjectId(pool, projectId);
//   return {
//     role: "system",
//     content: `Here are all the previous tasks of this project, if this is empty DO NOT invent new ones. Try to follow the structure of these tasks.
      
//       Previous tasks in project:
//       ${JSON.stringify(tasks)}
//       `,
//   };
// }

// // how to structure
