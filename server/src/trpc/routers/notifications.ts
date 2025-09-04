import z from "zod";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import { tryCatch } from "../../lib/utils.js";
import { getUnreadNotifications } from "../../db/queries/notifications.js";
import { pool } from "../../db/db.js";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = router({
  getUnreadNotifications: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        projectId: z.string(),
        username: z.string()
      })
    )
    .query(async ({input}) => {
        const result = await tryCatch(getUnreadNotifications(pool, input.username, input.projectId))
        if (result.error != null){
            console.error(result.error)
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to get unread notifications",
                cause: result.error,
            });
        }

        return result.data;
    })
})