import { z } from "zod";

// TASKS

// COLUMNS
export type ColumnKey = "backlog" | "in progress" | "for checking" | "done";

export type Columns = {
  [key in ColumnKey]: Task[];
};

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignedTo: z.array(z.string()),
  progress: z.string(),
  link: z.string().optional(),
  category: z.string().optional(),
  files: z.array(z.string()),
  projectTaskId: z.number(),
  commentCount: z.number(),
  targetStartDate: z.date().optional(),
  targetEndDate: z.date().optional(),
  dependsOn: z.array(z.object({id: z.string(), title: z.string()})),
  subtasks: z.array(z.object({title: z.string(), isDone: z.boolean()}))
});

export const CommentSchema = z.object({
  commentId: z.string(),
  comment: z.string(),
  commentBy: z.string(),
  createdAt: z.date(),
})

export type Task = z.infer<typeof TaskSchema>;
export type Comment = z.infer<typeof CommentSchema>;

export type InsertableTask = Omit<Task, "id" | "projectTaskId">;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  guestId: z.string()
})

export type Project = z.infer<typeof ProjectSchema>