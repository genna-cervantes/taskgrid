import { useContext, useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import { Task } from "../../../server/src/shared/types";

const TaskActionToast = ({
  actionContext,
  projectId,
}: {
  actionContext:
    | {
        action: string | undefined;
        setAction: (action: string | undefined) => void;
      }
    | undefined;
  projectId: string;
}) => {
  const recentTaskContext = useContext(RecentTaskContext);

  // added task, edited task, deleted task
  const [timer, setTimer] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useUtils();

  useEffect(() => {
    setTimer(5);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          actionContext?.setAction(undefined);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [actionContext]);

  const deleteTaskById = trpc.tasks.deleteTaskById.useMutation({
    onSuccess: (data) => {
      console.log("Task deleted:", data);

      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const undoDeleteTask = trpc.tasks.undoDeleteTask.useMutation({
    onSuccess: (data) => {
      console.log("Task reinserted:", data);

      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  // UPDATE TASKS
  const updateAssignedTo = trpc.tasks.updateAssignedTo.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskTitle = trpc.tasks.updateTaskTitle.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskDescription = trpc.tasks.updateTaskDescription.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskPriority = trpc.tasks.updateTaskPriority.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  // ARCHIVE TASKS
  const undoArchiveTasks = async (tasks: Task[]) => {
    await Promise.all(
      tasks.map((t) => undoDeleteTask.mutateAsync({ taskId: t.id }))
    );
  };

  const handleUndo = () => {
    if (!actionContext?.action) {
      return;
    }

    setIsLoading(true);

    if (actionContext.action === "added" && recentTaskContext?.tasks?.[0].id) {
      deleteTaskById.mutate({ taskId: recentTaskContext.tasks[0].id });
    } else if (
      actionContext.action === "deleted" &&
      recentTaskContext?.tasks?.[0].id
    ) {
      undoDeleteTask.mutate({ taskId: recentTaskContext.tasks[0].id });
    } else if (
      actionContext.action === "edited" &&
      recentTaskContext?.tasks?.[0].id
    ) {
      // edit spec task id to the most recent task details
      updateTaskTitle.mutate({
        taskId: recentTaskContext.tasks[0].id,
        title: recentTaskContext.tasks[0].title,
      });
      updateTaskDescription.mutate({
        taskId: recentTaskContext.tasks[0].id,
        description: recentTaskContext.tasks[0].description,
      });
      updateTaskPriority.mutate({
        taskId: recentTaskContext.tasks[0].id,
        priority: recentTaskContext.tasks[0].priority,
      });
      updateAssignedTo.mutate({
        taskId: recentTaskContext.tasks[0].id,
        assignTo: recentTaskContext.tasks[0].assignedTo,
      });
    } else if (
      actionContext.action === "archived" &&
      recentTaskContext?.tasks
    ) {
      undoArchiveTasks(recentTaskContext.tasks);
    }

    setIsLoading(false);
    actionContext?.setAction(undefined);
  };

  return (
    <div className="z-50 fixed bottom-8 dark:bg-light/50 bg-lmLightBackground/50 rounded-md flex justify-center items-center text-sm font-semibold gap-x-2 px-4 py-2">
      <h1 className="capitalize">{actionContext?.action} Task!</h1>
      <div className="flex gap-x-[3px]">
        <button
          onClick={handleUndo}
          disabled={isLoading}
          className="underline font-semibold cursor-pointer"
        >
          {!isLoading ? (
            "Undo"
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
        <h1>in {timer} second(s)</h1>
      </div>
    </div>
  );
};

export default TaskActionToast;
