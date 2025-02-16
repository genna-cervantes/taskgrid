// server/src/trpc/router.ts
import { router, publicProcedure } from './trpc.js';
import { z } from 'zod';

export const appRouter = router({
  hello: publicProcedure
    .input((z.object({name: z.string()})))
    .query(({input}) => {
      return `Hello ${input.name}!`;
    }),
  getTime: publicProcedure
    .query(() => {
      return new Date();
    }),
});

// Export type router type
export type AppRouter = typeof appRouter;