import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import superjson from 'superjson';

// Context function to handle requests
export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({ req, res });
type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
