import { z } from "zod";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import {
  addProject,
  deleteProject,
  editProjectName,
  getProjectDetails,
  getProjectNameByKey,
  getProjectOwner,
  getProjectStats,
  getUserWorkspaceProjects,
} from "../../db/queries/projects.js";
import { pool } from "../router.js";
import { tryCatch } from "../../lib/utils.js";
import { TRPCError } from "@trpc/server";

export const projectsRouter = router({
  addProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        username: z.string(),
        workspaceId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        addProject(pool, input.id, input.name, input.username, input.workspaceId)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
        });
      }

      return result.data;
    }),
  getProjectOwner: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getProjectOwner(pool, input.id));
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project owner",
          cause: result.error,
        });
      }

      return result.data;
    }),
  getProjectStats: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getProjectStats(pool, input.projectId));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project stats",
          cause: result.error,
        });
      }

      return result.data;
    }),
  editProjectName: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), name: z.string(), guestId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        editProjectName(pool, input.id, input.name, input.guestId)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project name",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project name",
        });
      }

      return result.data;
    }),
  getProjectNameByKey: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getProjectNameByKey(pool, input.id));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project name",
          cause: result.error,
        });
      }

      return result.data;
    }),
  deleteProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), guestId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(deleteProject(pool, input.id, input.guestId));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete project",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete project",
        });
      }

      return result.data;
    }),
  getUserWorkspaceProjects: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ username: z.string(), workspaceId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(
        getUserWorkspaceProjects(pool, input.username, input.workspaceId)
      );
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch workspace projects",
          cause: result.error,
        });
      }

      return result.data;
    }),
  getProjectDetails: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getProjectDetails(pool, input.projectId));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project details",
          cause: result.error,
        });
      }

      return result.data;
    }),
});
