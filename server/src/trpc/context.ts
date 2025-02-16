// server/src/trpc/context.ts
import * as trpc from '@trpc/server';
import * as express from 'express';

export const createContext = ({ req, res }: { req: express.Request; res: express.Response }) => ({
  req,
  res,
});

export type Context = trpc.inferAsyncReturnType<typeof createContext>;