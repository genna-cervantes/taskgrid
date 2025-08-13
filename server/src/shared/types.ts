import { z } from "zod";

// TASKS

// COLUMNS
export const ColumnKey = z.enum(['backlog', 'in progress', 'for checking', 'done']);
export type ColumnKey = z.infer<typeof ColumnKey>;

export type Columns = {
  [key in ColumnKey]: Task[];
};

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignTo: z.array(z.string()),
  progress: z.string(),
  link: z.string().url().optional(),
  category: z.string().optional(),
  files: z.array(z.string()).optional(),
  projectTaskId: z.number(),
  commentCount: z.number(),
  targetStartDate: z.date().optional(),
  targetEndDate: z.date().optional(),
  dependsOn: z.array(z.object({id: z.string(), title: z.string()})),
  subtasks: z.array(z.object({title: z.string(), isDone: z.boolean()})),
  index: z.number()
});

export const AddTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  assignTo: z.array(z.string()),
  progress: z.string(),
  category: z.string().optional().nullable(), // has to be nullable unfortunately cause ai sdk sort of forces JSON just post process after
  dependsOn: z.array(z.object({id: z.string(), title: z.string()})),
  subtasks: z.array(z.object({title: z.string(), isDone: z.boolean()}))
})

export type AddTask = z.infer<typeof AddTaskSchema>;

export const CommentSchema = z.object({
  commentId: z.string(),
  comment: z.string(),
  commentBy: z.string(),
  createdAt: z.date(),
})

export type Task = z.infer<typeof TaskSchema>;
export type Comment = z.infer<typeof CommentSchema>;

export type InsertableTask = Pick<Task, "title" | "description" | "priority" | "assignTo" | "progress" | "link" | "category" | "files" | "targetStartDate" | "targetEndDate">;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  guestId: z.string(),
  workspaceId: z.string()
})

export type Project = z.infer<typeof ProjectSchema>