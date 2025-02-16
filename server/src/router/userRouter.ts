import { z } from 'zod';

import { router, publicProcedure } from '../';

export const userRouter = router({
  list: publicProcedure
    .query(async () => {
    console.log('listing all users')

    return true;
  }),

  get: publicProcedure
    .input(z.string().min(1))
    .query(async ({ input: userId }) => {
    console.log('getting specific user')

    return true;
  }),

  create: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input: { id } }) => {
    console.log('creating user')

    return true;
  })
});