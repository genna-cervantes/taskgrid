import { z } from "zod";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import {
  addProject,
  deleteProject,
  editProjectName,
  getProjectNameByKey,
  getProjectOwner,
  getProjectStats,
  getUserWorkspaceProjects,
} from "../../db/queries/projects.js";
import { pool } from "../router.js";
import {
  addUserProjectLink,
  deleteUserProjectLink,
} from "../../db/queries/users.js";

export const projectsRouter = router({
  addProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        guestId: z.string(),
        workspaceId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let taskCount = await addProject(
        pool,
        input.id,
        input.name,
        input.guestId,
        input.workspaceId
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
  getProjectStats: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        let stats = await getProjectStats(pool, input.projectId);
        return stats;
      } catch (err) {
        console.error(err);
        return {};
      }
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
  getUserWorkspaceProjects: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string(), workspaceId: z.string() }))
    .query(async ({ input }) => {
      try {
        let projects = await getUserWorkspaceProjects(
          pool,
          input.guestId,
          input.workspaceId
        );
        return projects;
      } catch (err) {
        console.error(err);
        return [];
      }
    }),
});
