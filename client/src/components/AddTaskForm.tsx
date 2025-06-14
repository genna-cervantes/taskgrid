import React, { useContext, useState } from "react";
import { Task } from "../../../server/src/shared/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../utils/trpc";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import SelectAssignee from "./SelectAssignee";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  link: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  assignedTo: z
    .array(z.string())
    .min(1, { message: "At least one assignee is required" }),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const priorityLevels = ["low", "medium", "high"] as const;
export type PriorityLevel = (typeof priorityLevels)[number];

const AddTaskForm = ({
  projectId,
  col,
  setAddModal,
  username,
}: {
  projectId: string;
  col: string;
  setAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  username: string | undefined;
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
  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);

  const [taskAssignedTo, setTaskAssignedTo] = useState<string[]>([])

  const { data: usersInProject } =
    trpc.getUsernamesInProject.useQuery({
      id: projectId,
    });

  const insertTask = trpc.insertTask.useMutation({
    onSuccess: (data: Task) => {
      console.log("Task created:", data);

      recentTaskContext?.setTasks([data as Task]); // keep track of this task for removal later if undone
      actionContext?.setAction("added");
      setAddModal(false);

      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const onSubmit = (data: TaskFormData) => {
    console.log('inserting')
    insertTask.mutate({ id: projectId, task: { ...data, progress: col } });
  };

  const selectedPriority = watch("priority");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (insertTask.isLoading) {
          e.stopPropagation();
        } else {
          setAddModal(false);
        }
      }} // Close when clicking backdrop
    >
      <div
        className="dark:bg-light bg-lmLightBackground rounded-lg shadow-xl p-4 md:p-6 w-[90%] md:w-full max-w-md"
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
            <input
              {...register("title")}
              placeholder="New Task Title..."
              className="text-xs md:text-base"
            />
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
              className="text-xs md:text-base"
            />
            {errors.description && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.description.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <label htmlFor="description" className="text-xs font-semibold mb-2">
              Task Link:
            </label>
            <input
              {...register("link")}
              placeholder="New Task Link..."
              className="text-xs md:text-base"
            />
            {errors.link && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.link.message}
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
                  onClick={() =>
                    setValue("priority", p, { shouldValidate: true })
                  }
                  type="button"
                  className={`${
                        selectedPriority === p
                          ? "bg-lmMidBackground dark:bg-midWhite text-fadedBlack dark:text-white"
                          : "bg-lmBackground/60"
                      } text-sm md:text-base  dark:bg-faintWhite dark:text-white text-fadedBlack flex-1 hover:bg-lmMidBackground dark:hover:bg-midWhite rounded-md py-1 cursor-pointer transition-colors`}
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
            <SelectAssignee setValue={setValue} setTaskAssignedTo={setTaskAssignedTo} taskAssignedTo={taskAssignedTo} username={username ?? ""} usersInProject={usersInProject ?? []} />
            {errors.assignedTo && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.assignedTo.message}
              </p>
            )}
          </span>
          <button
            type="submit"
            className="w-full flex justify-center text-midBlack dark:text-fadedWhite font-semibold bg-lmBackground hover:bg-lmMidBackground dark:bg-faintWhite rounded-md py-2 cursor-pointer dark:hover:bg-midWhite text-xs md:text-base disabled:cursor-not-allowed disabled:bg-midWhite"
            disabled={insertTask.isLoading}
          >
            {!insertTask.isLoading ? (
              "Add Task"
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-loader-circle-icon lucide-loader-circle animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTaskForm;
