// server/src/trpc/trpc.ts
import { initTRPC } from '@trpc/server';
import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';
import superjson from 'superjson';

// Context type definition
export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
  req,
  res,
});

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Export reusable router and procedure builders
export const router = t.router;
export const publicProcedure = t.procedure;