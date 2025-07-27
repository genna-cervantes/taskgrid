import { z } from "zod";
import {
  checkWorkspaceId,
  getUserWorkspaces,
  insertWorkspace,
} from "../../db/queries/workspaces.js";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import { pool } from "../router.js";
import { tryCatch } from "../../lib/utils.js";
import { TRPCError } from "@trpc/server";

export const workspacesRouter = router({
  getUserWorkspaces: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getUserWorkspaces(pool, input.guestId));
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
    .input(z.object({ guestId: z.string(), workspaceId: z.string() }))
    .query(async ({ input }) => {
      
      let result = await tryCatch(checkWorkspaceId(pool, input.guestId, input.workspaceId))
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
        userId: z.string(),
        workspaceId: z.string(),
        workspaceName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(insertWorkspace(pool, input.userId, input.workspaceId, input.workspaceName));
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
});
