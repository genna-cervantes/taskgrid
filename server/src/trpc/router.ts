import { router, publicProcedure } from "./trpc.js";
import { Pool } from "pg";
import { config } from "dotenv";
import { rateLimitMiddleware } from "./middleware.js";
import { workspacesRouter } from "./routers/workspaces.js";
import { projectsRouter } from "./routers/projects.js";
import { usersRouter } from "./routers/users.js";
import { tasksRouter } from "./routers/tasks.js";
import { notificationsRouter } from "./routers/notifications.js";

config();

export const appRouter = router({
  workspaces: workspacesRouter,
  projects: projectsRouter,
  users: usersRouter,
  tasks: tasksRouter,
  notifications: notificationsRouter,
  health: publicProcedure.use(rateLimitMiddleware).query(() => {
    return {
      success: true,
      message: "All good here!"
    };
  }),
});

// Export type router type
export type AppRouter = typeof appRouter;
