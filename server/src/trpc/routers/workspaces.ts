import { z } from "zod";
import {
  checkWorkspaceId,
  deleteWorkspace,
  getUserWorkspaces,
  insertWorkspace,
  leaveWorkspace,
  updateWorkspaceName,
} from "../../db/queries/workspaces.js";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import { pool } from "../router.js";
import { tryCatch } from "../../lib/utils.js";
import { TRPCError } from "@trpc/server";

export const workspacesRouter = router({
  getUserWorkspaces: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getUserWorkspaces(pool, input.username));
      if (result.error != null){
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get user workspaces",
          cause: result.error
        })
      }
      
      return result.data;
    }),
  checkWorkspaceId: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      
      let result = await tryCatch(checkWorkspaceId(pool, input.workspaceId))
      if (result.error != null){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check workspace id",
          cause: result.error
        })
      }
      
      return result.data // returns workspace name | false -> workspace doesnt exist
    }),
  insertWorkspace: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        username: z.string(),
        workspaceId: z.string(),
        workspaceName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(insertWorkspace(pool, input.username, input.workspaceId, input.workspaceName));
      if (result.error != null){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create workspace",
          cause: result.error
        })
      }
      
      if (!result.data){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create workspace"
        })
      }

      return result.data;
    }),
  updateWorkspaceName: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ workspaceId: z.string(), workspaceName: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(updateWorkspaceName(pool, input.workspaceId, input.workspaceName));
      if (result.error != null){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update workspace name",
          cause: result.error
        })
      }

      if (!result.data){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update workspace name"
        })
      }

      return result.data;
    }),
  deleteWorkspace: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ workspaceId: z.string()}))
    .mutation(async ({ input }) => {
      let result = await tryCatch(deleteWorkspace(pool, input.workspaceId));
      if (result.error != null){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete workspace",
          cause: result.error
        })
      }

      if (!result.data){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete workspace"
        })
      }

      return result.data;
    }),
  leaveWorkspace: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ workspaceId: z.string(), username: z.string()}))
    .mutation(async ({ input }) => {
      let result = await tryCatch(leaveWorkspace(pool, input.workspaceId, input.username));
      if (result.error != null){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to leave workspace",
          cause: result.error
        })
      }

      if (!result.data){
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to leave workspace"
        })
      }

      return result.data;
    }),

});
