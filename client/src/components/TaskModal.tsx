import React from "react";
import { Task } from "../pages/Project";
import TaskPriority from "./TaskPriority";
import { trpc } from "../utils/trpc";
import { getUsernameForProject } from "../utils/indexedb";

const TaskModal = ({
  task,
  projectId,
  setTaskDetailsModal,
  setUsernameModal
}: {
  task: Task;
  projectId: string;
  setTaskDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const utils = trpc.useUtils();

  const deleteTask = trpc.deleteTask.useMutation({
    onSuccess: (data) => {
      console.log("Task deleted:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateAssignedTo = trpc.updateAssignedToTask.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const handleDeleteTask = () => {
    deleteTask.mutate({ taskId: task.id });
    setTaskDetailsModal(false);
  };

  const handleAssignToMe = async () => {
    // check if name is set in storage
    let username = await getUsernameForProject(projectId);

    if (username){
        // update assigned to
        updateAssignedTo.mutate({taskId: task.id, username})
    }else{
        setTaskDetailsModal(false);
        setUsernameModal(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setTaskDetailsModal(false)} // Close when clicking backdrop
    >
      <div
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <div className="flex justify-between">
          <div className="flex gap-x-2 text-2xl font-bold">
            <h1>[{task.projectTaskId}]</h1>
            <h1>{task.title}</h1>
          </div>
          <button
            onClick={() => setTaskDetailsModal(false)}
            className="bg-white/20 text-white text-sm font-semibold px-4 py-1 rounded-md cursor-pointer"
          >
            Close
          </button>
        </div>
        <div>
          <h3 className="font-semibold">Description:</h3>
          <h3 className="pl-4">{task?.description ?? ""}</h3>
        </div>
        <div>
          <h3 className="font-semibold">Priority:</h3>
          <span className="flex items-center pl-4 gap-x-2">
            <TaskPriority priority={task.priority} />
            <h3 className="">{task.priority}</h3>
          </span>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Assigned To:</h3>
            <button onClick={handleAssignToMe} className="font-semibold underline text-sm cursor-pointer">
              Assign To Me
            </button>
          </div>
          <h3 className="pl-4">{task.assignedTo}</h3>
        </div>
        <button
          onClick={handleDeleteTask}
          className="bg-red-400 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskModal;
