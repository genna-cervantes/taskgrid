// server/src/trpc/router.ts
import { router, publicProcedure } from './trpc.js';
import { z } from 'zod';
import { Pool } from "pg";
import { getTasksFromProjectId } from '../db/queries.js';
import { config } from "dotenv";

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
    .query(({input}) => {
      let tasks = getTasksFromProjectId(pool, input.id)
      return tasks;
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