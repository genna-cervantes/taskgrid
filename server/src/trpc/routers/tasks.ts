import { z } from "zod";
import { rateLimitMiddleware } from "../middleware.js";
import { publicProcedure, router } from "../trpc.js";
import {
  addComment,
  archiveTasksInColumn,
  deleteTask,
  deleteTaskById,
  getCommentsByTask,
  getFilteredTasks,
  getTaskById,
  getTaskCategoryOptions,
  getTaskIds,
  getTasksFromProjectId,
  insertTask,
  undoDeleteTask,
  updateAssignedTo,
  updateTask,
  updateTaskCategory,
  updateTaskCategoryOptions,
  updateTaskDependsOn,
  updateTaskDescription,
  updateTaskFiles,
  updateTaskLink,
  updateTaskOrderBatched,
  updateTaskPriority,
  updateTaskProgress,
  updateTaskSubTasks,
  updateTaskTargetEndDate,
  updateTaskTargetStartDate,
  updateTaskTitle,
} from "../../db/queries/tasks.js";
import { pool } from "../router.js";
import { ColumnKey, Comment, Task, TaskSchema } from "../../shared/types.js";
import { randomUUID } from "crypto";
import s3 from "../../aws/s3.js";
import { tryCatch } from "../../lib/utils.js";
import { TRPCError } from "@trpc/server";
import { io } from "../../server/server.js";
import { bus } from "../../websocket/bus.js";

export const tasksRouter = router({
  getTasks: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getTasksFromProjectId(pool, input.id));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tasks from project id",
          cause: result.error,
        });
      }

      return result.data;
    }),
  getTaskIds: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getTaskIds(pool, input.projectId));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch task ids",
          cause: result.error,
        });
      }

      return result.data;
    }),
  getTaskById: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ projectId: z.string(), taskId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(
        getTaskById(pool, input.projectId, input.taskId)
      );
      if (result.error !== null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch single task",
          cause: result.error,
        });
      }

      return result.data;
    }),
  insertTask: publicProcedure
    .use(rateLimitMiddleware)
    // auth middleware to get user id and if is guest
    .input(
      z.object({
        id: z.string(),
        task: TaskSchema.pick({ title: true, priority: true, assignTo: true, progress: true, files: true, description: true, link: true, category: true, targetStartDate: true, targetEndDate: true }),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(insertTask(pool, input.task, input.id));
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to insert tasks",
          cause: result.error,
        });
      }

      return result.data;
    }),
  updateTaskProgress: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string(), progress: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskProgress(pool, input.taskId, input.progress)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task progress",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task progress",
        });
      }

      return result.data;
    }),
  deleteTask: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(deleteTask(pool, input.taskId));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task",
        });
      }

      return result.data;
    }),
  updateAssignedTo: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ assignTo: z.array(z.string()), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateAssignedTo(pool, input.taskId, input.assignTo)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update assigned to",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update assigned to",
        });
      }

      return result.data;
    }),
  updateTaskTitle: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ title: z.string(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskTitle(pool, input.taskId, input.title)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task title",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task title",
        });
      }

      return result.data;
    }),
  updateTaskDescription: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ description: z.string().optional(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskDescription(pool, input.taskId, input.description)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task description",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task description",
        });
      }

      return result.data;
    }),
  updateTaskLink: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ link: z.string().optional(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskLink(pool, input.taskId, input.link)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task link",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task link",
        });
      }

      return result.data;
    }),
  updateTaskPriority: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ priority: z.string(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskPriority(pool, input.taskId, input.priority)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task priority",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task priority",
        });
      }

      return result.data;
    }),
  getTaskImages: publicProcedure
    .input(
      z.object({
        taskId: z.string(),
        projectId: z.string(),
        keys: z.array(z.string()),
      })
    )
    .query(({ input }) => {
      const urls = input.keys.map((k) => ({
        url: s3.getSignedUrl("getObject", {
          Bucket: process.env.S3_BUCKET,
          Key: k,
          Expires: 60,
        }),
        key: k,
      }));

      return urls;
    }),
  uploadTaskImages: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskId: z.string(),
        previousKeys: z.array(z.string()),
        files: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const uploads = input.files.map(({ name, type }) => {
        const key = `${input.projectId}/${
          input.taskId
        }/${randomUUID()}-${name}`;

        const url = s3.getSignedUrl("putObject", {
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          ContentType: type,
          ACL: "private",
          Expires: 60,
        });

        return {
          name,
          key,
          url,
        };
      });

      const keys = uploads.map((u) => u.key);

      let result = await tryCatch(
        updateTaskFiles(
          pool,
          input.taskId,
          input.projectId,
          keys,
          input.previousKeys,
          uploads
        )
      );

      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task files",
          cause: result.error,
        });
      }

      if (result.data && !result.data.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task files",
        });
      }

      return result.data as {
        success: true;
        uploads: {
          name: string;
          key: string;
          url: string;
        }[];
      };
    }),
  updateTaskTargetStartDate: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        taskId: z.string(),
        projectId: z.string(),
        targetStartDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const targetStartDate = input?.targetStartDate
        ? new Date(input.targetStartDate)
        : undefined;

      let result = await tryCatch(
        updateTaskTargetStartDate(
          pool,
          input.taskId,
          input.projectId,
          targetStartDate
        )
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task target start date",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task target start date",
        });
      }

      return result.data;
    }),
  updateTaskTargetEndDate: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        taskId: z.string(),
        projectId: z.string(),
        targetEndDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const targetEndDate = input?.targetEndDate
        ? new Date(input.targetEndDate)
        : undefined;

      let result = await tryCatch(
        updateTaskTargetEndDate(
          pool,
          input.taskId,
          input.projectId,
          targetEndDate
        )
      );

      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task target end date",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task target end date",
        });
      }

      return result.data;
    }),
  updateTaskCategory: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        taskId: z.string(),
        projectId: z.string(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskCategory(pool, input.taskId, input.projectId, input?.category)
      );

      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task category",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task category",
        });
      }

      return result.data;
    }),
  updateTaskDependsOn: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        taskId: z.string(),
        projectId: z.string(),
        dependsOn: z.array(z.object({ id: z.string(), title: z.string() })),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskDependsOn(
          pool,
          input.projectId,
          input.taskId,
          input.dependsOn
        )
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task depends on",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task depends on",
        });
      }

      return result.data;
    }),
  updateTaskSubtasks: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        taskId: z.string(),
        projectId: z.string(),
        subtasks: z.array(z.object({ title: z.string(), isDone: z.boolean() })),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskSubTasks(pool, input.projectId, input.taskId, input.subtasks)
      );

      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task subtasks",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task subtasks",
        });
      }

      return result.data;
    }),
  updateTaskOrderBatched: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        payload: z.array(
          z.object({
            taskId: z.string(),
            index: z.number(),
            progress: ColumnKey,
          })
        ),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskOrderBatched(pool, input.payload, input.projectId)
      );

      console.log('payload', input.payload)

      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task order",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task order",
        });
      }

      return result.data;
    }),
  deleteTaskById: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(deleteTaskById(pool, input.taskId));

      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task by id",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task by id",
        });
      }

      return result.data;
    }),
  undoDeleteTask: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(undoDeleteTask(pool, input.taskId));

      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to undo delete task",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to undo delete task",
        });
      }

      return result.data;
    }),
  filterTask: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        priority: z.string(),
        assignedTo: z.string(),
        id: z.string(),
        category: z.string(),
        projectTaskIds: z.string(),
      })
    )
    .query(async ({ input }) => {
      let result = await tryCatch(
        getFilteredTasks(
          pool,
          input.priority,
          input.assignedTo,
          input.category,
          input.projectTaskIds,
          input.id
        )
      );
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch filter tasks",
          cause: result.error,
        });
      }

      return result.data;
    }),
  archiveTaskByColumn: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ id: z.string(), column: z.string() }))
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        archiveTasksInColumn(pool, input.id, input.column)
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to archive task by column",
          cause: result.error,
        });
      }
      return result.data;
    }),
  addComment: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        taskId: z.string(),
        projectId: z.string(),
        comment: z.string(),
        commentBy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        addComment(pool, input.taskId, input.projectId, input.comment, input.commentBy)
      );
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add comment",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add comment",
        });
      }

      return result.data;
    }),
  getCommentsByTask: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(getCommentsByTask(pool, input.taskId));
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get comments by task",
          cause: result.error,
        });
      }

      return result.data;
    }),
  getTaskCategoryOptions: publicProcedure
    .use(rateLimitMiddleware)
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      let result = await tryCatch(
        getTaskCategoryOptions(pool, input.projectId)
      );
      if (result.error != null) {
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get task category options",
          cause: result.error,
        });
      }

      return result.data;
    }),
  updateTaskCategoryOptions: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        projectId: z.string(),
        taskCategoryOptions: z.array(
          z.object({ category: z.string(), color: z.string() })
        ),
      })
    )
    .mutation(async ({ input }) => {
      let result = await tryCatch(
        updateTaskCategoryOptions(
          pool,
          input.projectId,
          input.taskCategoryOptions
        )
      );
      if (result.error != null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task category options",
          cause: result.error,
        });
      }
      
      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task category options",
        });
      }
      
      return result.data;
    }),
  updateTask: publicProcedure
    .input(z.object({
      taskId: z.string(),
      updates: TaskSchema.partial()
    }))
    .mutation(async ({input}) => {
      let result = await tryCatch(updateTask(pool, input.taskId, input.updates))
      if (result.error != null){
        console.error(result.error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task",
          cause: result.error,
        });
      }

      if (!result.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task",
        });
      }

      return result.data;
    }),
});
