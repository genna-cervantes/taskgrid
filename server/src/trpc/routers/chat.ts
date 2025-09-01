import express, { Response } from "express";
import { openai } from "@ai-sdk/openai";
import {
  ModelMessage,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  generateText,
  pipeUIMessageStreamToResponse,
  stepCountIs,
  streamObject,
  streamText,
  tool,
} from "ai";
import { z } from "zod";
import {
  GENERATE_DAILY_STARTER_NOTIFICATION_SYSTEM_PROMPT,
  GENERATE_TASK_MESSAGE_SYSTEM_PROMPT,
  GENERATE_TASK_SYSTEM_PROMPT,
  INFER_REQUEST_SYSTEM_PROMPT,
  MAKE_PLAN_SYSTEM_PROMPT,
  QUERY_TASK_MESSAGE_SYSTEM_PROMPT,
  QUERY_TASKS_SYSTEM_PROMPT,
  TASKAN_SYSTEM_PROMPT,
  UPDATE_TASK_MESSAGE_SYSTEM_PROMPT,
  UPDATE_TASKS_SYSTEM_PROMPT,
} from "../../lib/prompts.js";
import {
  addTaskCategoryOptions,
  getSimilarTasks,
  getTaskCategoryOptions,
  getTasksFromProjectId,
  insertTask,
  updateTask,
} from "../../db/queries/tasks.js";
import { pool } from "../router.js";
import { getUsersInProject } from "../../db/queries/users.js";
import { tryCatch } from "../../lib/utils.js";
import { AddTask } from "../../shared/types.js";
import { OpenAi } from "../../lib/openai.js";
import { randomUUID } from "crypto";
import pLimit from "p-limit"

// cant stream if trpc

export const chatRouter = express.Router();


export const generateDailyStarterNotificationMessage = async ({
  messages,
}: {
  messages: ModelMessage[];
}) => {
  const result = await generateObject({
    model: openai("gpt-4o"),
    messages: messages,
    system: GENERATE_DAILY_STARTER_NOTIFICATION_SYSTEM_PROMPT,
    schema: z.object({
      title: z.string(),
      message: z.string(),
    }),
    schemaDescription: `The return schema for generating a daily starter notification message.  It is a single object with a parameter
    title: string and message: string.  The title should be a short title and the message should be a detailed message containing the bullet points.`,
  });

  return result.object;
};

// understand prompt
const makePlan = async ({
  messages,
  jobQueue,
  writer,
}: {
  messages: UIMessage[];
  writer: any;
  jobQueue: {
    GENERATE_TASK: {
      context: string;
    }[];
    UPDATE_TASK: {
      context: string;
    }[];
    QUERY_TASK: {
      context: string;
    }[];
  };
}) => {
  const modelMessages = convertToModelMessages(messages);
  const result = streamText({
    model: openai("gpt-4o"),
    messages: modelMessages,
    system: MAKE_PLAN_SYSTEM_PROMPT,
    tools: {
      queueGenerateTask: tool({
        description: `Tool for generating a new task, used when the user prompt indicates the creation of ONE OR MORE tasks.
        Required input is an object with parameter context: string, which must be the exact portion of the prompt INCLUDING RELEVANT CONTEXT that triggered this tool call.
         `,
        inputSchema: z.object({
          context: z.string(),
        }),
        execute: async ({ context }) => {
          jobQueue["GENERATE_TASK"].push({
            context,
          });

          return true;
        },
      }),
      queueQueryTask: tool({
        description: `Tool for querying about ONE OR MORE tasks, used when the user prompt indicates querying or asking about ONE OR MORE tasks.
        Required input is an object with parameter context: string, which must be the exact portion of the prompt INCLUDING RELEVANT CONTEXT that triggered this tool call.
        `,
        inputSchema: z.object({
          context: z.string(),
        }),
        execute: async ({ context }) => {
          jobQueue["QUERY_TASK"].push({
            context,
          });

          return true;
        },
      }),
      queueUpdateTask: tool({
        description: `Tool for updating ONE OR MORE tasks, used when the user prompt indicates updating ONE OR MORE tasks.
        Required input is an object with parameter context: string, which must be the exact portion of the prompt INCLUDING RELEVANT CONTEXT that triggered this tool call.
        `,
        inputSchema: z.object({
          context: z.string(),
        }),
        execute: async ({ context }) => {
          jobQueue["UPDATE_TASK"].push({
            context,
          });

          return true;
        },
      }),
    },
    stopWhen: stepCountIs(10), // possible multiple tasks eh
  });

  const ui = result.toUIMessageStream();
  for await (const uiEvent of ui) {
    writer.write(uiEvent); // forward planner tokens to the client
  }
};

const updateTasks = async ({ messages }: { messages: UIMessage[] }) => {
  const modelMessages = convertToModelMessages(messages);

  const result = await generateObject({
    model: openai("gpt-4o"),
    messages: modelMessages,
    system: UPDATE_TASKS_SYSTEM_PROMPT,
    schemaName: "Update_Tasks_Schema",
    schemaDescription: `The scema for updating tasks given a users prompt.  An object which contains an array of objects 
    with parameters originalTaskId: string which is the original task id and updatedTask which is an object containing 
    the updated parameters of that specific task`,
    schema: z.object({
      skippedUpdates: z.array(
        z.object({ originalTaskId: z.string(), reason: z.string() })
      ),
      updatedTasks: z.array(
        z.object({
          originalTaskId: z.string(),
          updatedTask: z.object({
            title: z.string().nullable(),
            priority: z.enum(["low", "medium", "high"]).nullable(),
            assignTo: z.array(z.string()).nullable(),
            progress: z
              .enum(["backlog", "in progress", "for checking", "done"])
              .nullable(),
            dependsOn: z
              .object({
                id: z.string(),
                title: z.string(),
              })
              .nullable(),
            subtasks: z
              .object({
                title: z.string(),
                isDone: z.boolean(),
              })
              .nullable(),
            description: z.string().optional().nullable(),
            category: z.string().optional().nullable(),
          }),
        })
      ),
    }),
  });

  return result.object;
};

const queryTask = async ({ messages }: { messages: UIMessage[] }) => {
  const modelMessages = convertToModelMessages(messages);

  const result = await generateObject({
    model: openai("gpt-4o"),
    messages: modelMessages,
    system: QUERY_TASKS_SYSTEM_PROMPT,
    schemaName: "Filtered_Tasks_Array",
    schemaDescription: `The return schema for filtering tasks based on the user query.  It is a single object with a parameter
    filteredTaskIds which is an array of task projectTaskIds which are numbers`,
    schema: z.object({
      filteredTaskIds: z.array(z.number()),
    }),
  });

  return result.object;
};

const generateTask = async ({
  messages,
  projectId,
}: {
  messages: UIMessage[];
  projectId: string;
}) => {
  const modelMessages = convertToModelMessages(messages);

  const { text, steps } = await generateText({
    model: openai("gpt-4o"),
    messages: modelMessages,
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
            color: z.enum([
              "red",
              "orange",
              "lime",
              "yellow",
              "green",
              "teal",
              "blue",
              "indigo",
              "purple",
              "pink",
              "rose",
            ]),
          }),
        }),
        execute: async ({ categoryOption }) => {
          const result = await tryCatch(
            addTaskCategoryOptions(pool, projectId, categoryOption)
          );
          if (result.error) {
            return {
              error: `unable to add category option due to ${result.error}`,
            };
          }
          if (!result.data) {
            return {
              error: `unable to add category option due to ${result.error}`,
            };
          }

          return result.data;
        },
      }),
    },
    stopWhen: stepCountIs(10), // possible multiple tasks eh
  });

  return { text, steps };
};

const updateTaskMessage = async ({
  messages,
  writer,
}: {
  messages: UIMessage[];
  writer: any;
}) => {
  const modelMessages = convertToModelMessages(messages);
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: modelMessages,
    system: UPDATE_TASK_MESSAGE_SYSTEM_PROMPT,
  });

  const ui = result.toUIMessageStream();
  for await (const uiEvent of ui) {
    writer.write(uiEvent); // forward planner tokens to the client
  }
};

const generateTaskMessage = async ({
  messages,
  writer,
}: {
  messages: UIMessage[];
  writer: any;
}) => {
  const modelMessages = convertToModelMessages(messages);
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: modelMessages,
    system: GENERATE_TASK_MESSAGE_SYSTEM_PROMPT,
  });

  const ui = result.toUIMessageStream();
  for await (const uiEvent of ui) {
    writer.write(uiEvent); // forward planner tokens to the client
  }
};

const queryTaskMessage = async ({
  messages,
  writer,
}: {
  messages: UIMessage[];
  writer: any;
}) => {
  const modelMessages = convertToModelMessages(messages);
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: modelMessages,
    system: QUERY_TASK_MESSAGE_SYSTEM_PROMPT,
  });

  const ui = result.toUIMessageStream();
  for await (const uiEvent of ui) {
    writer.write(uiEvent); // forward planner tokens to the client
  }
};

// const messages: ModelMessage[] = [];

chatRouter.post("/", async (req, res) => {
  // get necessary data
  let jobQueue: {
    GENERATE_TASK: { context: string }[];
    UPDATE_TASK: { context: string }[];
    QUERY_TASK: { context: string }[];
  } = {
    GENERATE_TASK: [],
    UPDATE_TASK: [],
    QUERY_TASK: [],
  };
  const projectId = req.body.projectId;

  // server
  const { messages }: { messages: UIMessage[] } = req.body;
  // messages.push({ role: "user", content: prompt });

  const uiMessageStream = createUIMessageStream({
    async execute({ writer }) {
      try {

        if (!projectId) throw new Error("Missing project id")

        await makePlan({ messages, writer, jobQueue });
        writer.write({
          id: Math.random().toString(),
          type: "data-text",
          data: { text: "\n\n" },
        });

        console.log('sent plan')
        console.log('jq', jobQueue);

        // check if jq empty so say not in knolwedge base/ cannot do that

        let totalGenerateContext = "";
        for (let i = 0; i < jobQueue["GENERATE_TASK"].length; i++) {
          let jq = jobQueue["GENERATE_TASK"][i];

          totalGenerateContext += `\nSnippet ${i}: ${jq.context}`;
        }

        if (totalGenerateContext.trim() !== "") {
          messages.push({
            id: Math.random.toString(),
            role: "system",
            parts: [
              {
                type: "text",
                text: `This message contains the CONTEXT for GENERATING tasks.  The following is a collection of relevant snippets from the users prompt regarding GENERATING tasks
              
              Context:
              ${totalGenerateContext.trim()}`,
              },
            ],
          });

          let executingGenerateId = Math.random().toString();
          writer.write({
            id: executingGenerateId,
            type: "data-state",
            data: {
              visible: true,
              text: "Generating Tasks",
              id: `execute-span-${executingGenerateId}`,
            },
          });

          await runGenerateTask({
            messages,
            projectId,
            writer,
            executingGenerateId,
          });          

          writer.write({
            id: Math.random().toString(),
            type: "data-text",
            data: { text: "" },
          });
          await generateTaskMessage({ messages, writer });
        } 

        let totalUpdateContext = "";
        for (let i = 0; i < jobQueue["UPDATE_TASK"].length; i++) {
          let jq = jobQueue["UPDATE_TASK"][i];

          totalUpdateContext += `\nSnippet ${i}: ${jq.context}`;
        }

        if (totalUpdateContext.trim() !== "") {
          messages.push({
            id: Math.random.toString(),
            role: "system",
            parts: [
              {
                type: "text",
                text: `This message contains the CONTEXT for UPDATING tasks.  The following is a collection of relevant snippets from the users prompt regarding UPDATING tasks
              
              Context:
              ${totalUpdateContext.trim()}`,
              },
            ],
          });

          let executingUpdateId = Math.random().toString();
          writer.write({
            id: executingUpdateId,
            type: "data-state",
            data: {
              visible: true,
              text: "Updating Tasks",
              id: `execute-span-${executingUpdateId}`,
            },
          });

          await runUpdateTask({
            messages,
            projectId,
            writer,
            executingUpdateId,
          });

          writer.write({
            id: Math.random().toString(),
            type: "data-text",
            data: { text: "" },
          });
          await updateTaskMessage({ messages, writer });
        }

        let totalQueryContext = "";
        for (let i = 0; i < jobQueue["QUERY_TASK"].length; i++) {
          let jq = jobQueue["QUERY_TASK"][i];

          totalQueryContext += `\nSnippet ${i}: ${jq.context}`;
        }

        if (totalQueryContext.trim() !== totalQueryContext) {
          messages.push({
            id: Math.random.toString(),
            role: "system",
            parts: [
              {
                type: "text",
                text: `This message contains the CONTEXT for QUERYING tasks.  The following is a collection of relevant snippets from the users prompt regarding QUERYING tasks
              
              Context:
              ${totalQueryContext.trim()}`,
              },
            ],
          });

          let executingQueryId = Math.random().toString();
          writer.write({
            id: executingQueryId,
            type: "data-state",
            data: {
              visible: true,
              text: "Querying Tasks",
              id: `execute-span-${executingQueryId}`,
            },
          });

          await runQueryTask({
            messages,
            projectId,
            writer,
            executingQueryId,
          });

          writer.write({
            id: Math.random().toString(),
            type: "data-text",
            data: { text: "" },
          });
          await queryTaskMessage({ messages, writer });
        }
      } catch (err) {
        writer.write({
          id: Math.random().toString(),
          type: "data-text",
          data: { text: "" },
        });
        writer.write({
          id: Math.random().toString(),
          type: "data-error",
          data: {
            text: "Oops an error occured, we couldnt process your request, pls try again.",
          },
        });

        console.error(err)
        throw new Error("Server Error");
      }
    },
    onError: (error: any) => `Custom error: ${error.message}`,
    onFinish: ({ messages, isContinuation, responseMessage }) => {
      console.log("Stream finished with messages:", messages);
      console.log(JSON.stringify(messages[0].parts));
    },
  });

  pipeUIMessageStreamToResponse({
    response: res,
    status: 200,
    statusText: "OK",
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
    },
    stream: uiMessageStream,
  });
});

const runUpdateTask = async ({
  messages,
  projectId,
  writer,
  executingUpdateId,
}: {
  messages: UIMessage[];
  projectId: string;
  writer: any;
  executingUpdateId: string;
}) => {
  // add context
  messages.push(
    ...(await Promise.all([
      getPreviousTasksMessage(projectId),
      getCategoryOptionsMessage(projectId),
      getAssignableUsersMessage(projectId),
    ]))
  );

  // generate object
  // find task id(s) to be updated
  // generate updated task object (properties only)
  const tasksToUpdate = await updateTasks({ messages });

  // loop thru all and update
  for (let i = 0; i < tasksToUpdate.updatedTasks.length; i++) {
    let ut = tasksToUpdate.updatedTasks[i];

    // remove nulls
    const cleaned = Object.fromEntries(
      Object.entries(ut.updatedTask).filter(([_, v]) => v !== null)
    );

    await updateTask(pool, ut.originalTaskId, cleaned);
  }

  // message to the user
  messages.push({
    id: Math.random.toString(),
    role: "system",
    parts: [
      {
        type: "text",
        text: `The following are the task updates.
                
        Task updates:
        ${JSON.stringify(tasksToUpdate.updatedTasks)}
        `,
      },
    ],
  });
  messages.push({
    id: Math.random.toString(),
    role: "system",
    parts: [
      {
        type: "text",
        text: `The following are the task updates skipped because they are not doable.  This includes the task id and the 
        reason why it was not updated.
                
        Skipped updates:
        ${JSON.stringify(tasksToUpdate.skippedUpdates)}
        `,
      },
    ],
  });

  // set loading to false
  writer.write({
    id: Math.random().toString(),
    type: "data-state",
    data: {
      visible: false,
      text: "Updating Tasks",
      id: `execute-span-${executingUpdateId}`,
    },
  });
};

const runQueryTask = async ({
  messages,
  projectId,
  writer,
  executingQueryId,
}: {
  messages: UIMessage[];
  projectId: string;
  writer: any;
  executingQueryId: string;
}) => {
  // add context
  messages.push(await getPreviousTasksMessage(projectId));

  const filteredTaskIds = await queryTask({ messages });
  writer.write({
    id: Math.random().toString(),
    type: "data-query",
    data: { ...filteredTaskIds },
  });

  messages.push({
    id: Math.random.toString(),
    role: "system",
    parts: [
      {
        type: "text",
        text: `The following is the total number of queried tasks: ${filteredTaskIds.filteredTaskIds.length}`,
      },
    ],
  });

  writer.write({
    id: Math.random().toString(),
    type: "data-state",
    data: {
      visible: false,
      text: "Querying Tasks",
      id: `execute-span-${executingQueryId}`,
    },
  });
};

const runGenerateTask = async ({
  messages,
  projectId,
  writer,
  executingGenerateId,
}: {
  messages: UIMessage[];
  projectId: string;
  writer: any;
  executingGenerateId: string;
}) => {
  // add context
  messages.push(
    ...(await Promise.all([
      getCategoryOptionsMessage(projectId),
      getAssignableUsersMessage(projectId),
      getPreviousTasksMessage(projectId),
    ]))
  );

  // get task object from llm call
  let { text: returnText } = await generateTask({ messages, projectId });
  let parsedText = JSON.parse(returnText);
  let tasksToAdd: AddTask[] = parsedText.tasks;

  // post process tasks from generate task
  const postprocessedTasks = tasksToAdd.map((t) => ({
    ...t,
    category: t.category === null ? undefined : t.category,
    description: t.description === null ? undefined : t.description,
  }));

  let duplicateTasks: {
    skippedTask: {
      title: string;
      description: string | undefined;
      priority: "low" | "medium" | "high";
      assign_to: string[];
    };
    duplicateTaskTitle: string;
  }[] = [];

  const uniqueTasks = (
    await Promise.all(
      postprocessedTasks.map(async (ppt) => {
        const embedResult = await OpenAi.embeddings.create({
          model: "text-embedding-3-small",
          input: JSON.stringify(ppt),
        });
        const embedding = embedResult.data[0].embedding;
        const vectorString = `[${embedding.join(",")}]`;

        const duplicateTask = await getSimilarTasks(
          pool,
          projectId,
          vectorString
        );
        if (duplicateTask) {
          duplicateTasks.push({
            skippedTask: duplicateTask,
            duplicateTaskTitle: duplicateTask.title,
          });
        } else {
          return ppt;
        }
      })
    )
  ).filter((result) => !!result);

  writer.write({
    id: Math.random().toString(),
    type: "data-text",
    data: { text: "" },
  });

  // returns a promise while capping concurrent tasks
  const limit = pLimit(5);

  const inserts = uniqueTasks.map((ppt) => 
    limit(async () => {
      try{
        const res = await insertTask(pool, ppt, projectId)
        writer.write({
          id: Math.random().toString(),
          type: "data-generated",
          data: {
            text: `Generated task: ${ppt.title}`,
          },
        });

        return {ok: true, value: res}
      }catch(err){
        writer.write({
          id: Math.random().toString(),
          type: "data-generated",
          data: {
            text: `Failed to generate task: ${ppt.title}`,
          },
        });
        throw err;
      }
    })
  )

  await Promise.all(inserts)
  console.log('done inserting')

  // message to the user
  messages.push({
    id: Math.random.toString(),
    role: "system",
    parts: [
      {
        type: "text",
        text: `The following are the tasks skipped because they have existing very similar tasks on the board.  The structure
                is {skippedTask: duplicateTask, duplicateTaskTitle: duplicateTask.title} where skippedTask is the skipped task and 
                duplicateTaskTitle is the title of the already existing similar task on the board.  If this is empty this means there are
                no skipped tasks.
                
                Skipped tasks:
                ${JSON.stringify(duplicateTasks)}
                `,
      },
    ],
  });

  messages.push({
    id: Math.random.toString(),
    role: "system",
    parts: [
      {
        type: "text",
        text: `The following are the tasks added to the board.
              
              Added tasks:
              ${JSON.stringify(uniqueTasks)}
              `,
      },
    ],
  });

  writer.write({
    id: Math.random().toString(),
    type: "data-state",
    data: {
      visible: false,
      text: "Generating Tasks",
      id: `execute-span-${executingGenerateId}`,
    },
  });
};

// get project specifications to inject to query
const getCategoryOptionsMessage = async (
  projectId: string
): Promise<UIMessage> => {
  const categoryOptions = await getTaskCategoryOptions(pool, projectId);
  return {
    id: Math.random.toString(),
    role: "system",
    parts: [
      {
        type: "text",
        text: `Here are the category options of this project, if this is empty DO NOT invent new ones for the tasks.  
      
      Category options:
      ${categoryOptions ? JSON.stringify(categoryOptions) : []}
      `,
      },
    ],
  };
};

// get assignable users
const getAssignableUsersMessage = async (
  projectId: string
): Promise<UIMessage> => {
  const assignableUsers = await getUsersInProject(pool, projectId);
  return {
    id: Math.random.toString(),
    role: "system",
    parts: [
      {
        type: "text",
        text: `Here are the members and possible assignees of this project, if this is empty DO NOT invent new ones for the tasks.  
      
      Possible assignees:
      ${JSON.stringify(assignableUsers)}
      `,
      },
    ],
  };
};

// get all previous tasks
const getPreviousTasksMessage = async (
  projectId: string
): Promise<UIMessage> => {
  const tasks = await getTasksFromProjectId(pool, projectId);
  return {
    id: randomUUID(),
    role: "system",
    parts: [
      {
        type: "text",
        text: `Here are all the previous tasks of this project, if this is empty DO NOT invent new ones. Try to follow the structure of these tasks.
      
      Previous tasks in project:
      ${JSON.stringify(tasks)}
      `,
      },
    ],
  };
};

// how to structure
