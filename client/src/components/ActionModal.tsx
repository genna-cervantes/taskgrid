import { useContext, useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import { RecentTaskContext } from "../contexts/RecentTaskContext";

const ActionModal = ({
  actionContext,
  projectId,
}: {
  actionContext: {
    action: string | undefined;
    setAction: (action: string | undefined) => void;
} | undefined;
  projectId: string;
}) => {
  const recentTaskContext = useContext(RecentTaskContext);

  // added task, edited task, deleted task
  const [timer, setTimer] = useState(5);
  const utils = trpc.useUtils();

  useEffect(() => {
    setTimer(5);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1){
          clearInterval(interval)
          actionContext?.setAction(undefined)
          return 0;
        }
        return prev - 1;
      });
    }, 1000)

    return () => clearInterval(interval)

  }, [actionContext])
  

  const deleteTaskById = trpc.deleteTaskById.useMutation({
    onSuccess: (data) => {
      console.log("Task deleted:", data);

      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const undoDeleteTask = trpc.undoDeleteTask.useMutation({
    onSuccess: (data) => {
      console.log("Task reinserted:", data);

      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  // UPDATE TASKS
  const updateAssignedTo = trpc.updateAssignedTo.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskTitle = trpc.updateTaskTitle.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskDescription = trpc.updateTaskDescription.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskPriority = trpc.updateTaskPriority.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const handleUndo = () => {
    if (!actionContext?.action){
      return;
    }

    if (actionContext.action === "added" && recentTaskContext?.task?.id) {
      deleteTaskById.mutate({ taskId: recentTaskContext.task.id });
    } else if (actionContext.action === "deleted" && recentTaskContext?.task?.id) {
      undoDeleteTask.mutate({ taskId: recentTaskContext.task.id });
    } else if (actionContext.action === "edited" && recentTaskContext?.task?.id) {
      // edit spec task id to the most recent task details
      updateTaskTitle.mutate({
        taskId: recentTaskContext.task.id,
        title: recentTaskContext.task.title,
      });
      updateTaskDescription.mutate({
        taskId: recentTaskContext.task.id,
        description: recentTaskContext.task.description,
      });
      updateTaskPriority.mutate({
        taskId: recentTaskContext.task.id,
        priority: recentTaskContext.task.priority,
      });
      updateAssignedTo.mutate({
        taskId: recentTaskContext.task.id,
        username: recentTaskContext.task.assignedTo,
      });
    }

    actionContext?.setAction(undefined);
  };

  return (
    <div className="z-50 fixed bottom-8 bg-[#464646]/50 rounded-md flex justify-center items-center text-sm font-semibold gap-x-2 px-4 py-2">
      <h1 className="capitalize">{actionContext?.action} Task!</h1>
      <div className="flex gap-x-[3px]">
        <button
          onClick={handleUndo}
          className="underline font-semibold cursor-pointer"
        >
          Undo
        </button>
        <h1>in {timer} second(s)</h1>
      </div>
    </div>
  );
};

export default ActionModal;
