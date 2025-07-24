import { z } from "zod";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import {
  addUserProjectLink,
  checkGuestId,
  checkGuestIdAndWorkspaces,
  getUsername,
  getUsernamesInProject,
  getUsersInProject,
  insertUser,
  insertUserWithWorkspace,
  kickUserFromProject,
  setUsername,
} from "../../db/queries/users.js";
import { pool } from "../router.js";

export const usersRouter = router({
  insertUserWithWorkspace: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        username: z.string(),
        guestId: z.string(),
        workspaceId: z.string(),
        workspaceName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let insertCount = await insertUserWithWorkspace(
        pool,
        input.username,
        input.guestId,
        input.workspaceId,
        input.workspaceName
      );
      if (insertCount && insertCount > 0)
        return { userId: input.guestId, workspaceId: input.workspaceId };
      return false;
    }),
  setUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({ username: z.string(), guestId: z.string(), id: z.string() })
    )
    .mutation(async ({ input }) => {
      let userCount = await setUsername(
        pool,
        input.username,
        input.guestId,
        input.id
      );
      if (userCount && userCount > 0) return true;
      return false;
    }),
  checkGuestId: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string() }))
    .query(async ({ input }) => {
      try {
        let userCount = await checkGuestId(pool, input.guestId);
        if (userCount && userCount === 1) return true;
        return false;
      } catch (err) {
        console.log(err);
      }
    }),
  checkGuestIdAndWorkspaces: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string() }))
    .query(async ({ input }) => {
      try {
        let data = await checkGuestIdAndWorkspaces(pool, input.guestId);

        return {
          userExists: data.userExists,
          workspaces: data.workspaces as string[],
        };
      } catch (err) {
        console.log(err);
      }
    }),
  getUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), guestId: z.string() }))
    .query(async ({ input }) => {
      let username = await getUsername(pool, input.id, input.guestId);
      return username;
    }),
  kickUserFromProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      let userCount = await kickUserFromProject(pool, input.id, input.guestId);
      if (userCount && userCount === 1) return true;
      return false;
    }),
  getUsersInProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let users = await getUsersInProject(pool, input.id);
      return users;
    }),
  getUsernamesInProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let users = await getUsernamesInProject(pool, input.id);
      return users as string[];
    }),
  insertUserProjectLink: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({ id: z.string(), username: z.string(), guestId: z.string() })
    )
    .mutation(async ({ input }) => {
      let userProjectLinkCount = await addUserProjectLink(
        pool,
        input.id,
        input.guestId,
        input.username
      );
      if (userProjectLinkCount && userProjectLinkCount > 0) {
        return userProjectLinkCount;
      }
      return false;
    }),
  insertUser: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ username: z.string(), guestId: z.string() }))
    .mutation(async ({ input }) => {
      let taskCount = await insertUser(pool, input.username, input.guestId);
      if (taskCount && taskCount > 0) return true;
      return false;
    }),
});
