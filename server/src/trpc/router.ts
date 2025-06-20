// server/src/trpc/router.ts
import { router, publicProcedure } from "./trpc.js";
import { z } from "zod";
import { Pool } from "pg";
import { randomUUID } from "crypto";
import {
  addProject,
  addUserProjectLink,
  archiveTasksInColumn,
  checkGuestId,
  deleteProject,
  deleteTask,
  deleteTaskById,
  deleteUserProjectLink,
  editProjectName,
  getFilteredTasks,
  getProjectNameByKey,
  getProjectOwner,
  getProjectsFromGuestId,
  getTasksFromProjectId,
  getUsername,
  getUsernamesInProject,
  getUsersInProject,
  insertTask,
  insertUser,
  kickUserFromProject,
  setUsername,
  undoDeleteTask,
  updateAssignedTo,
  updateTaskDescription,
  updateTaskFiles,
  updateTaskLink,
  updateTaskPriority,
  updateTaskProgress,
  updateTaskTitle,
} from "../db/queries.js";
import { config } from "dotenv";
import { rateLimitMiddleware } from "./middleware.js";
import { Task, TaskSchema } from "../shared/types.js";
import s3 from "../aws/s3.js";

config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? "5432"),
});

export const appRouter = router({
  getUserProjects: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string() }))
    .query(async ({ input }) => {
      let projects = await getProjectsFromGuestId(pool, input.guestId);
      return projects;
    }),
  getTasks: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let tasks = await getTasksFromProjectId(pool, input.id);
      return tasks;
    }),
  insertTask: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        id: z.string(),
        task: TaskSchema.omit({ id: true, projectTaskId: true }),
      })
    )
    .mutation(async ({ input }) => {
      console.log("got here");
      let task = await insertTask(pool, input.task, input.id);
      // if (taskCount && taskCount > 0) return true
      return task;
    }),
  updateTaskProgress: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string(), progress: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await updateTaskProgress(
        pool,
        input.taskId,
        input.progress
      );
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  deleteTask: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await deleteTask(pool, input.taskId);
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  insertUser: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ username: z.string(), guestId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await insertUser(pool, input.username, input.guestId);
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  setUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({ username: z.string(), guestId: z.string(), id: z.string() })
    )
    .mutation(async ({ input }) => {
      let userCount = await setUsername(
        pool,
        input.username,
        input.guestId,
        input.id
      );
      if (userCount && userCount > 0) return true;
      return false;
    }),
  checkGuestId: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string() }))
    .query(async ({ input }) => {
      let userCount = await checkGuestId(pool, input.guestId);
      if (userCount && userCount === 1) return true;
      return false;
    }),
  getUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), guestId: z.string() }))
    .query(async ({ input }) => {
      let username = await getUsername(pool, input.id, input.guestId);
      return username;
    }),
  kickUserFromProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      let userCount = await kickUserFromProject(pool, input.id, input.guestId);
      if (userCount && userCount === 1) return true;
      return false;
    }),
  getUsernamesInProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let users = await getUsernamesInProject(pool, input.id);
      return users as string[];
    }),
  getUsersInProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let users = await getUsersInProject(pool, input.id);
      return users;
    }),
  updateAssignedTo: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ assignTo: z.array(z.string()), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await updateAssignedTo(
        pool,
        input.taskId,
        input.assignTo
      );
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  updateTaskTitle: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ title: z.string(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await updateTaskTitle(pool, input.taskId, input.title);
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  updateTaskDescription: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ description: z.string().optional(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await updateTaskDescription(
        pool,
        input.taskId,
        input.description
      );
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  updateTaskLink: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ link: z.string().optional(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await updateTaskLink(pool, input.taskId, input.link);
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  updateTaskPriority: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ priority: z.string(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await updateTaskPriority(
        pool,
        input.taskId,
        input.priority
      );
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  getTaskImages: publicProcedure
    .input(
      z.object({
        taskId: z.string(),
        projectId: z.string(),
        keys: z.array(z.string()),
      })
    )
    .query(({ input }) => {
      const urls = input.keys.map((k) => ({
        url: s3.getSignedUrl("getObject", {
          Bucket: process.env.S3_BUCKET,
          Key: k,
          Expires: 60,
        }),
        key: k,
      }));

      return urls;
    }),
  uploadTaskImages: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskId: z.string(),
        previousKeys: z.array(z.string()),
        files: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const uploads = await Promise.all(
        input.files.map(async ({ name, type }) => {
          const key = `${input.projectId}/${input.taskId}/${randomUUID()}-${name}`;

          const url = s3.getSignedUrl("putObject", {
            Bucket: process.env.S3_BUCKET!,
            Key: key,
            ContentType: type,
            ACL: "private",
            Expires: 60,
          });

          return {
            name,
            key,
            url,
          };
        })
      );

      const keys = uploads.map((u) => u.key);
      await updateTaskFiles(
        pool,
        input.taskId,
        input.projectId,
        keys,
        input.previousKeys
      );

      return { success: true, files: uploads };
    }),
  deleteTaskById: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await deleteTaskById(pool, input.taskId);
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  undoDeleteTask: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await undoDeleteTask(pool, input.taskId);
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  addProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), name: z.string(), guestId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await addProject(
        pool,
        input.id,
        input.name,
        input.guestId
      );
      let userProjectLinkCount = await addUserProjectLink(
        pool,
        input.id,
        input.guestId,
        ""
      );
      if (
        taskCount &&
        userProjectLinkCount &&
        taskCount > 0 &&
        userProjectLinkCount > 0
      ) {
        return taskCount;
      }
      return false;
    }),
  getProjectOwner: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let guestId = await getProjectOwner(pool, input.id);
      if (guestId) {
        return guestId as string;
      }
      return false;
    }),
  insertUserProjectLink: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({ id: z.string(), username: z.string(), guestId: z.string() })
    )
    .mutation(async ({ input }) => {
      let userProjectLinkCount = await addUserProjectLink(
        pool,
        input.id,
        input.guestId,
        input.username
      );
      if (userProjectLinkCount && userProjectLinkCount > 0) {
        return userProjectLinkCount;
      }
      return false;
    }),
  editProjectName: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), name: z.string(), guestId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await editProjectName(
        pool,
        input.id,
        input.name,
        input.guestId
      );
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  getProjectNameByKey: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let projectName = await getProjectNameByKey(pool, input.id);
      return projectName as string;
    }),
  deleteProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), guestId: z.string() }))
    .mutation(async ({ input }) => {
      let projectCount = await deleteProject(pool, input.id, input.guestId);
      let userProjectLinkCount = await deleteUserProjectLink(
        pool,
        input.id,
        input.guestId
      );

      if (
        projectCount &&
        projectCount > 0 &&
        userProjectLinkCount &&
        userProjectLinkCount > 0
      )
        return true;
      return false;
    }),
  filterTask: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({ priority: z.string(), assignedTo: z.string(), id: z.string() })
    )
    .query(async ({ input }) => {
      let filteredTasks = await getFilteredTasks(
        pool,
        input.priority,
        input.assignedTo,
        input.id
      );
      return filteredTasks as Task[];
    }),
  archiveTaskByColumn: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), column: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await archiveTasksInColumn(pool, input.id, input.column);
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
  sample: publicProcedure.use(rateLimitMiddleware).query(() => {
    return "hello";
  }),
});

// Export type router type
export type AppRouter = typeof appRouter;
