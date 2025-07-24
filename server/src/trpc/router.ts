import { router, publicProcedure } from "./trpc.js";
import { Pool } from "pg";
import { config } from "dotenv";
import { rateLimitMiddleware } from "./middleware.js";
import { workspacesRouter } from "./routers/workspaces.js";
import { projectsRouter } from "./routers/projects.js";
import { usersRouter } from "./routers/users.js";
import { tasksRouter } from "./routers/tasks.js";

config();

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? "5432"),
});

export const appRouter = router({
  workspaces: workspacesRouter,
  projects: projectsRouter,
  users: usersRouter,
  tasks: tasksRouter,
  health: publicProcedure.use(rateLimitMiddleware).query(() => {
    return {
      success: true,
      message: "All good here!"
    };
  }),
});

// Export type router type
export type AppRouter = typeof appRouter;
