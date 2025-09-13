import z from "zod";
import { pool } from "../../db/db.js";
import { getTriageTasks } from "../../db/queries/triage.js";
import { tryCatch } from "../../lib/utils.js";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import { TRPCError } from "@trpc/server";

export const triageRouter = router({
    getTriageTasks: publicProcedure
        .use(rateLimitMiddleware)
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            let result = await tryCatch(getTriageTasks(pool, input.projectId));
            if (result.error != null) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch triage tasks",
                    cause: result.error,
                });
            }
            return result.data;
        })
})