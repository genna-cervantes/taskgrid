// server/src/trpc/router.ts
import { router, publicProcedure } from './trpc.js';
import { z } from 'zod';
import { Pool } from "pg";
import { getTasksFromProjectId, insertTask } from '../db/queries.js';
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
  hello: publicProcedure
    .input((z.object({name: z.string()})))
    .query(({input}) => {
      return `Hello ${input.name}!`;
    }),
  getTime: publicProcedure
    .query(() => {
      return new Date();
    }),
});

// Export type router type
export type AppRouter = typeof appRouter;