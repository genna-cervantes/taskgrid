import { z } from "zod";
import {
  checkWorkspaceId,
  getUserWorkspaces,
  insertWorkspace,
} from "../../db/queries/workspaces.js";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import { pool } from "../router.js";

export const workspacesRouter = router({
  getUserWorkspaces: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string() }))
    .query(async ({ input }) => {
      try {
        let workspaces = await getUserWorkspaces(pool, input.guestId);
        return workspaces as { workspaceId: string; name: string }[];
      } catch (err) {
        console.error(err);
        return [];
      }
    }),
  checkWorkspaceId: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string(), workspaceId: z.string() }))
    .query(async ({ input }) => {
      try {
        let exists = await checkWorkspaceId(
          pool,
          input.guestId,
          input.workspaceId
        );
        return exists;
      } catch (err) {
        console.error(err);
        return false;
      }
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
      let insertCount = await insertWorkspace(
        pool,
        input.userId,
        input.workspaceId,
        input.workspaceName
      );
      if (insertCount && insertCount > 0)
        return { workspaceId: input.workspaceId };
      return false;
    }),
});
