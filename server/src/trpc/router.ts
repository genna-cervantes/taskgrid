// server/src/trpc/router.ts
import { router, publicProcedure } from './trpc.js';
import { z } from 'zod'
import { Pool } from "pg";
import { addProject, deleteProject, deleteTask, deleteTaskById, editProjectName, getFilteredTasks, getProjectNameByKey, getProjectsFromGuestId, getTasksFromProjectId, getUsername, getUsernamesInProject, getUsersInProject, insertTask, setUsername, undoDeleteTask, updateAssignedTo, updateTaskDescription, updateTaskLink, updateTaskPriority, updateTaskProgress, updateTaskTitle } from '../db/queries.js';
import { config } from "dotenv";
import { rateLimitMiddleware } from './middleware.js';
import { Task, TaskSchema } from '../shared/types.js';

config()

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
    .input((z.object({guestId: z.string()})))
    .query(async ({input}) => {
      let projects = await getProjectsFromGuestId(pool, input.guestId);
      return projects;
    }),
  getTasks: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string()})))
    .query(async ({input}) => {
      let tasks = await getTasksFromProjectId(pool, input.id)
      return tasks;
    }), 
  insertTask: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string(), task: TaskSchema.omit({ id: true, projectTaskId: true })})))
    .mutation(async ({input}) => {
      console.log('got here')
      let task = await insertTask(pool, input.task, input.id)
      // if (taskCount && taskCount > 0) return true
      return task;
    }),
  updateTaskProgress: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({taskId: z.string(), progress: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await updateTaskProgress(pool, input.taskId, input.progress)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  deleteTask: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await deleteTask(pool, input.taskId)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  setUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({username: z.string(), id: z.string(), guestId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await setUsername(pool, input.id, input.username, input.guestId)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  getUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string(), guestId: z.string()})))
    .query(async ({input}) => {
      let username = await getUsername(pool, input.id, input.guestId);
      return username;
    }),
  getUsernamesInProject: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string()})))
    .query(async ({input}) => {
      let users = await getUsernamesInProject(pool, input.id)
      return users as string[];
    }),
  getUsersInProject: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string()})))
    .query(async ({input}) => {
      let users = await getUsersInProject(pool, input.id)
      return users;
    }),
  updateAssignedTo: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({username: z.string(), taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await updateAssignedTo(pool, input.taskId, input.username)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  updateTaskTitle: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({title: z.string(), taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await updateTaskTitle(pool, input.taskId, input.title)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  updateTaskDescription: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({description: z.string().optional(), taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await updateTaskDescription(pool, input.taskId, input.description)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  updateTaskLink: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({link: z.string().optional(), taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await updateTaskLink(pool, input.taskId, input.link)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  updateTaskPriority: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({priority: z.string(), taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await updateTaskPriority(pool, input.taskId, input.priority)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  deleteTaskById: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await deleteTaskById(pool, input.taskId)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  undoDeleteTask: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({taskId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await undoDeleteTask(pool, input.taskId)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  addProject: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string(), name: z.string(), guestId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await addProject(pool, input.id, input.name, input.guestId)
      if (taskCount && taskCount > 0) {
        return taskCount
      }
      return false;
    }),
  editProjectName: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string(), name: z.string(), guestId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await editProjectName(pool, input.id, input.name, input.guestId)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  getProjectNameByKey: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string()})))
    .query(async ({input}) => {
      let projectName = await getProjectNameByKey(pool, input.id)
      return projectName as string;
    }),
  deleteProject: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({id: z.string(), guestId: z.string()})))
    .mutation(async ({input}) => {
      let taskCount = await deleteProject(pool, input.id, input.guestId)
      if (taskCount && taskCount > 0) return true
      return false;
    }),
  filterTask: publicProcedure
    .use(rateLimitMiddleware)
    .input((z.object({priority: z.string(), assignedTo: z.string(), id: z.string()})))
    .query(async ({input}) => {
      let filteredTasks = await getFilteredTasks(pool, input.priority, input.assignedTo, input.id)
      return filteredTasks as Task[]
    }),
  sample: publicProcedure
    .use(rateLimitMiddleware)
    .query(() => {
      return 'hello'
    })
  
});

// Export type router type
export type AppRouter = typeof appRouter;