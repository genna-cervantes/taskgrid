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
  assignedTo: z.string(),
  progress: z.string(),
  projectTaskId: z.number(),
});

export type Task = z.infer<typeof TaskSchema>;

export type InsertableTask = Omit<Task, "id" | "projectTaskId">;
