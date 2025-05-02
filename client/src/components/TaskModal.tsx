import React, { useContext, useEffect, useState } from "react";
import { Task } from "../pages/Project";
import TaskPriority from "./TaskPriority";
import { trpc } from "../utils/trpc";
import { getUsernameForProject } from "../utils/indexedb";
import { priorityLevels } from "./AddTaskForm";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";

const TaskModal = ({
  task,
  projectId,
  setTaskDetailsModal,
  setUsernameModal,
  username
}: {
  task: Task;
  projectId: string;
  setTaskDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
  username: string|undefined
}) => {
  const utils = trpc.useUtils();

  const [editMode, setEditMode] = useState(false);

  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskDescription, setTaskDescription] = useState(task.description);
  const [taskPriority, setTaskPriority] = useState(task.priority);
  const [taskAssignedTo, setTaskAssignedTo] = useState(task.assignedTo);
  
  const actionContext = useContext(ActionContext)
  const recentTaskContext = useContext(RecentTaskContext)
  
  const { data: usersInProject, isLoading: usersLoading } =
    trpc.getUsersInProject.useQuery({
      id: projectId,
    });

  const deleteTask = trpc.deleteTask.useMutation({
    onSuccess: (data) => {
      console.log("Task deleted:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  // TRPC METHODS

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

  // HANDLE METHODS

  const handleDeleteTask = () => {
    recentTaskContext?.setTask(task) // keep track of this task for insertion later if undone
    
    deleteTask.mutate({ taskId: task.id });
    setTaskDetailsModal(false);
    
    actionContext?.setAction("deleted")
    
};

const handleSaveTask = () => {
    recentTaskContext?.setTask(task) // keep track of this task for rollback later if undone

    if (task.title !== taskTitle) {
        updateTaskTitle.mutate({title: taskTitle, taskId: task.id})
    }
    
    if (task.description !== taskDescription){
        updateTaskDescription.mutate({description: taskDescription, taskId: task.id})
    }
    
    if (task.priority !== taskPriority){
        updateTaskPriority.mutate({priority: taskPriority, taskId: task.id})
    }   
    
    if (task.assignedTo !== taskAssignedTo){
        updateAssignedTo.mutate({username: taskAssignedTo, taskId: task.id})
    }   
    
    setEditMode(false);
    
    actionContext?.setAction("edited")
  };

  const handleAssignToMe = async () => {
    // check if name is set in storage
    if (username) {
      // update assigned to
      updateAssignedTo.mutate({ taskId: task.id, username });
    } else {
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
            {editMode ? (
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            ) : (
              <h1>{task.title}</h1>
            )}
          </div>
          <button
            onClick={() => setTaskDetailsModal(false)}
            className="bg-white/20 text-white text-sm font-semibold px-4 py-1 rounded-md cursor-pointer"
          >
            Close
          </button>
        </div>
        <div>
          <h3 className={`font-semibold ${editMode ? "text-xs pb-1" : ""}`}>
            Description:
          </h3>
          {editMode ? (
            <textarea
              className="w-full"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
          ) : (
            <h3 className="pl-4">{task?.description ?? ""}</h3>
          )}
        </div>
        <div>
          <h3 className={`font-semibold ${editMode ? "text-xs pb-1" : ""}`}>
            Priority:
          </h3>
          {editMode ? (
            <div className="flex w-full gap-x-2">
              {priorityLevels.map((p) => (
                <button
                  key={p}
                  onClick={() => setTaskPriority(p)}
                  type="button"
                  className={`${taskPriority === p ? "bg-white/40" : "bg-white/20"} flex-1 rounded-md py-1 hover:bg-white/40 cursor-pointer`}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <span className="flex items-center pl-4 gap-x-2">
              <TaskPriority priority={task.priority} />
              <h3 className="">{task.priority}</h3>
            </span>
          )}
        </div>
        <div>
          <div className="flex justify-between items-center">
            <h3 className={`font-semibold ${editMode ? "text-xs pb-1" : ""}`}>
              Assigned To:
            </h3>
            {!editMode && (task.assignedTo !== username) && (
              <button
                onClick={handleAssignToMe}
                className="font-semibold underline text-sm cursor-pointer"
              >
                Assign To Me
              </button>
            )}
          </div>
          {editMode ? (
            <select
              id="assignTo"
              className="w-full"
              value={taskAssignedTo}
              onChange={(e) => setTaskAssignedTo(e.target.value)}
            >
              {!usersLoading &&
                usersInProject?.map((u) => (
                  <option key={u} value={u} className="bg-[#464646]">
                    {u}
                  </option>
                ))}
            </select>
          ) : (
            <h3 className="pl-4">{task.assignedTo} {task.assignedTo === username ? '(You)' : ''}</h3>
          )}
        </div>
        <div className="flex flex-col gap-y-2">
          {editMode ? (
            <button
              onClick={handleSaveTask}
              className="bg-green-400 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-white/20 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer"
            >
              Edit
            </button>
          )}
          {!editMode && <button
            onClick={handleDeleteTask}
            className="bg-red-400 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer"
          >
            Delete
          </button>}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
