// server/src/trpc/router.ts
import { router, publicProcedure } from './trpc.js';
import { z } from 'zod';
import { Pool } from "pg";
import { deleteTask, getTasksFromProjectId, getUsersInProject, insertTask, setUsername, updateTaskProgress } from '../db/queries.js';
import { config } from "dotenv";
import { TaskSchema } from '../schemas/schemas.js';

config()

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? "5432"),
});


export const appRouter = router({
  getTasks: publicProcedure
    .input((z.object({id: z.string()})))
    .query(async ({input}) => {
      let tasks = await getTasksFromProjectId(pool, input.id)
      return tasks;
    }), 
  insertTask: publicProcedure
    .input((z.object({id: z.string(), task: TaskSchema.omit({ id: true, projectTaskId: true })})))
    .mutation(async ({input}) => {
      let taskCount = await insertTask(pool, input.task, input.id)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  updateTaskProgress: publicProcedure
    .input((z.object({taskId: z.string(), progress: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await updateTaskProgress(pool, input.taskId, input.progress)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  deleteTask: publicProcedure
    .input((z.object({taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await deleteTask(pool, input.taskId)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
    setUsername: publicProcedure
    .input((z.object({username: z.string(), id: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await setUsername(pool, input.id, input.username)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  getUsersInProject: publicProcedure
    .input((z.object({id: z.string()})))
    .query(async ({input}) => {
      let users = await getUsersInProject(pool, input.id)
      return users as string[];
    })
  
});

// Export type router type
export type AppRouter = typeof appRouter;