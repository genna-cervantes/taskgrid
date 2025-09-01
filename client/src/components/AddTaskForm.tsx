import React, { useContext, useEffect, useState } from "react";
import { Task } from "../../../server/src/shared/types";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../utils/trpc";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import TaskTitle from "./TaskTitle";
import TaskDescription from "./TaskDescription";
import TaskSelectPriority from "./TaskSelectPriority";
import TaskAssignee from "./TaskAssignee";
import Mousetrap from "mousetrap";
import TaskSelectCategory from "./TaskSelectCategory";

const TaskAddSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignTo: z.array(z.string()),
  category: z.string().optional(),
}) satisfies z.ZodType<
  Pick<
    Task,
    | "title"
    | "description"
    | "priority"
    | "assignTo"
    | "category"
  >
>;

export type TaskAdd = z.infer<typeof TaskAddSchema>;

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
  setAddModal: React.Dispatch<React.SetStateAction<string>>;
  username: string | undefined;
}) => {
  const form = useForm<TaskAdd>({
    resolver: zodResolver(TaskAddSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: undefined,
      assignTo: [],
      category: undefined
    }
  });

  const { data: usersInProject } = trpc.users.getUsernamesInProject.useQuery({
    id: projectId,
  });

  const utils = trpc.useUtils();

  const { data: taskCategoryOptionsRes, isLoading: taskCategoryOptionsIsLoading } =
    trpc.tasks.getTaskCategoryOptions.useQuery({ projectId });

  const [taskCategoryOptions, setTaskCategoryOptions] = useState(
    taskCategoryOptionsRes ?? []
  );

  const insertTask = trpc.tasks.insertTask.useMutation({
    onSuccess: async (data) => {
      console.log("Task created:", data);
      setAddModal("");
      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const onSubmit = async (data: TaskAdd) => {
    insertTask.mutate({ userId: username, id: projectId, task: { ...data, progress: col } }); // empty files array first
  };

  // keyboard shortcuts
  useEffect(() => {
    Mousetrap.bind("esc", function (e) {
      e.preventDefault();
      setAddModal("");
    });

    return () => {
      Mousetrap.unbind("esc");
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/[8%]"
      onClick={(e) => {
        if (insertTask.isLoading) {
          e.stopPropagation();
        } else {
          setAddModal("");
        }
      }} // Close when clicking backdrop
    >
      <div
        className="dark:bg-backgroundDark bg-lmLightBackground rounded-lg shadow-xl p-4 md:p-6 w-1/2"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <form
          onSubmit={form.handleSubmit(
            onSubmit, // Success handler
            (errors) => {
              // Error handler
              console.log("Form validation errors:", errors);
            }
          )}
          className="flex flex-col gap-y-4"
        >
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <TaskTitle
                taskTitle={field.value}
                setTaskTitle={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="category"
            render={({ field, fieldState }) => (
              <TaskSelectCategory
                projectId={projectId}
                taskCategoryOptions={taskCategoryOptions}
                taskCategoryOptionsIsLoading={taskCategoryOptionsIsLoading}
                setTaskCategoryOptions={setTaskCategoryOptions}
                taskCategory={field.value}
                setTaskCategory={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="priority"
            render={({ field, fieldState }) => (
              <TaskSelectPriority
                priorityLevels={priorityLevels}
                taskPriority={field.value}
                setTaskPriority={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="assignTo"
            render={({ field, fieldState }) => (
              <TaskAssignee
                projectId={projectId}
                username={username}
                usersInProj={usersInProject ?? []}
                taskAssignedTo={field?.value ?? []}
                setTaskAssignedTo={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <TaskDescription
                taskDescription={field.value}
                setTaskDescription={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <button
            type="submit"
            className="w-full flex justify-center mt-4 text-midBlack dark:text-fadedWhite font-semibold bg-lmBackground hover:bg-lmMidBackground dark:bg-green-400 rounded-md py-1 cursor-pointer text-xs md:text-base disabled:cursor-not-allowed disabled:bg-midWhite"
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
