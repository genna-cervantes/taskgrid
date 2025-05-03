import React, { useContext, useEffect, useState } from "react";
import { ColumnKey, Task } from "../pages/Project";
import { cn } from "../utils/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../utils/trpc";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  assignedTo: z.string({
    required_error: "Assignee is required",
  }),
});

type TaskFormData = z.infer<typeof taskSchema>;

export const priorityLevels = ["low", "medium", "high"] as const;
export type PriorityLevel = (typeof priorityLevels)[number];

const AddTaskForm = ({
  projectId,
  col,
  setAddModal,
  username
}: {
  projectId: string;
  col: string
  setAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  username: string|undefined
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const utils = trpc.useUtils();
  const actionContext = useContext(ActionContext)
  const recentTaskContext = useContext(RecentTaskContext)

  const { data: usersInProject, isLoading: usersLoading } = trpc.getUsersInProject.useQuery({
      id: projectId,
    });

  const insertTask = trpc.insertTask.useMutation({
    onSuccess: (data: Task) => {
      console.log("Task created:", data);
    
      recentTaskContext?.setTask(data as Task) // keep track of this task for removal later if undone
      actionContext?.setAction("added")

      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const onSubmit = (data: TaskFormData) => {
    insertTask.mutate({id: projectId, task: {...data, progress: col}});
    setAddModal(false)
  };

  const selectedPriority = watch("priority");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setAddModal(false)} // Close when clicking backdrop
    >
      <div
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-y-4"
        >
          <span className="w-full flex flex-col">
            <label htmlFor="title" className="text-xs font-semibold mb-2">
              Task Title:
            </label>
            <input {...register("title")} placeholder="New Task Title..." />
            {errors.title && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.title.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <label htmlFor="description" className="text-xs font-semibold mb-2">
              Task Description:
            </label>
            <textarea
              {...register("description")}
              placeholder="New Task Description..."
            />
            {errors.description && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.description.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <label htmlFor="priority" className="text-xs font-semibold mb-2">
              Task Priority:
            </label>
            <span className="flex gap-x-2 text-sm">
              {priorityLevels.map((p) => (
                <button
                    key={p}
                  onClick={() => setValue("priority", p, { shouldValidate: true })}
                  type="button"
                  className={`${selectedPriority === p ? "bg-white/40" : "bg-white/20"} flex-1 rounded-md py-1 hover:bg-white/40 cursor-pointer`}
                >
                  {p}
                </button>
              ))}
            </span>
            {errors.priority && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.priority.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <label htmlFor="assignTo" className="text-xs font-semibold mb-2">
              Assign To:
            </label>
            <select {...register("assignedTo")} id="assignTo">
              {!usersLoading && usersInProject?.map((u) => (
                <option key={u} value={u} className="bg-[#464646]">
                  {u} {u === username ? '(You)' : ''}
                </option>
              ))}
            </select>
          </span>
          <button
            type="submit"
            className="w-full text-sm bg-white/20 rounded-md py-2 cursor-pointer hover:bg-white/40"
          >
            Add Task
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTaskForm;
