import { z } from "zod";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import {
  checkGuestId,
  checkUsername,
  checkUsernameAndWorkspaces,
  editUsername,
  getUsername,
  getUsernamesInProject,
  getUsersInProject,
  insertUser,
  insertUserWithWorkspace,
  kickUserFromProject,
  updateTimezone,
} from "../../db/queries/users.js";
import { pool } from "../../db/db.js";
import { tryCatch } from "../../lib/utils.js";
import { TRPCError } from "@trpc/server";

export const usersRouter = router({
  insertUserWithWorkspace: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        username: z.string(),
        workspaceId: z.string(),
        workspaceName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        insertUserWithWorkspace(
          pool,
          input.username,
          input.workspaceId,
          input.workspaceName
        )
      );
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user and workspace",
          cause: result.error,
        });
      }
      
      if (!result.data) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user and workspace",
        });
      }

      return result.data;
    }),
  editUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({ username: z.string(), editedUsername: z.string() })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        editUsername(pool, input.username, input.editedUsername)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update username",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update username",
        });
      }

      return result.data;
    }),
  checkGuestId: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(checkGuestId(pool, input.guestId));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch guest id",
          cause: result.error,
        });
      }

      return result.data;
    }),
  checkUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(
        checkUsername(pool, input.username)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check username",
          cause: result.error,
        });
      }

      return result.data;
    }),
  checkUsernameAndWorkspaces: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(
        checkUsernameAndWorkspaces(pool, input.username)
      );
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch username and workspaces",
          cause: result.error,
        });
      }

      return result.data;
    }),
  getUsername: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), guestId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getUsername(pool, input.id, input.guestId));
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch username",
          cause: result.error,
        });
      }

      return result.data;
    }),
  kickUserFromProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ guestId: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        kickUserFromProject(pool, input.id, input.guestId)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove user from project",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove user from project",
        });
      }

      return result.data;
    }),
  getUsersInProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string()}))
    .query(async ({ input }) => {
      let result = await tryCatch(getUsersInProject(pool, input.id));
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users in project",
          cause: result.error,
        });
      }

      return result.data;
    }),
  getUsernamesInProject: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string()}))
    .query(async ({ input }) => {
      let result = await tryCatch(getUsernamesInProject(pool, input.id));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch usernames in project",
          cause: result.error,
        });
      }

      return result.data;
    }),
  insertUser: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ username: z.string(), guestId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        insertUser(pool, input.username, input.guestId)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      return result.data;
    }),

  updateTimezone: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ username: z.string(), timezone: z.string()}))
    .mutation(async ({input}) => {
      console.log('upd timezone running')
      let result = await tryCatch(updateTimezone(pool, input.username, input.timezone))
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user timezone",
          cause: result.error,
        });
      }
      
      if (!result.data) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user timezone",
        });
      }

      return result.data;
    })
});
