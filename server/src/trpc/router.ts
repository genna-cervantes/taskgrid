import { router, publicProcedure } from "./trpc.js";
import { z } from "zod";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return { message: `Hello, ${input.name ?? "World"}!` };
    }),

  getTime: publicProcedure.query(() => {
    return { time: new Date().toISOString() };
  }),
});

// Export router type for frontend usage
export type AppRouter = typeof appRouter;
