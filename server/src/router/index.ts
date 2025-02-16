import { router } from '..';
import { userRouter } from './userRouter';

export const appRouter = router({
  user: userRouter
});

export type AppRouter = typeof appRouter;