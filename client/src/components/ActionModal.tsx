import React, { useContext, useEffect, useState } from "react";
import { ActionContext } from "../contexts/ActionContext";
import { trpc } from "../utils/trpc";
import { RecentTaskContext } from "../contexts/RecentTaskContext";

const ActionModal = ({ action, projectId }: { action: string, projectId: string }) => {
  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);

  // added task, edited task, deleted task
  const [timer, setTimer] = useState(5);

  // remove notif
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // cleanup
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      actionContext?.setAction(undefined)
    }
}, [timer]);

const utils = trpc.useUtils();

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
        
    })
    
    const handleUndo = () => {
        if (action === 'added' && recentTaskContext?.task?.id){
            deleteTaskById.mutate({taskId: recentTaskContext.task.id})
        }
        
        else if (action === 'deleted' && recentTaskContext?.task?.id){
            undoDeleteTask.mutate({taskId: recentTaskContext.task.id})
        }
            
        actionContext?.setAction(undefined)
    }

  return (
    <div className="z-50 fixed bottom-8 bg-[#464646]/50 rounded-md flex justify-center items-center text-sm font-semibold gap-x-2 px-4 py-2">
      <h1 className="capitalize">
        {action} Task!
      </h1>
      <div className="flex gap-x-[3px]">
        <button onClick={handleUndo} className="underline font-semibold cursor-pointer">
            Undo
        </button>
        <h1>
            in {timer} second(s)
        </h1>
      </div>
    </div>
  );
};

export default ActionModal;
