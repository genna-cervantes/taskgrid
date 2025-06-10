import React, { useContext, useState } from "react";
import { Task } from "../../../server/src/shared/types";
import TaskPriority from "./TaskPriority";
import { trpc } from "../utils/trpc";
import { priorityLevels } from "./AddTaskForm";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import { z } from "zod";

const linkSchema = z.string().url();

const TaskModal = ({
  task,
  projectId,
  setTaskDetailsModal,
  setUsernameModal,
  username,
}: {
  task: Task;
  projectId: string;
  setTaskDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
  username: string | undefined;
}) => {
  const utils = trpc.useUtils();

  const [editMode, setEditMode] = useState(false);

  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskDescription, setTaskDescription] = useState(task.description);
  const [taskPriority, setTaskPriority] = useState(task.priority);
  const [taskAssignedTo, setTaskAssignedTo] = useState(task.assignedTo);
  const [taskLink, setTaskLink] = useState(task.link);
  const [taskLinkError, setTaskLinkError] = useState("");

  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);

  const { data: usersInProject, isLoading: usersLoading } =
    trpc.getUsernamesInProject.useQuery({
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

  const updateTaskLink = trpc.updateTaskLink.useMutation({
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
    recentTaskContext?.setTasks([task]); // keep track of this task for insertion later if undone
    
    deleteTask.mutate({ taskId: task.id });
    setTaskDetailsModal(false);

    actionContext?.setAction("deleted");
  };

  const handleSaveTask = () => {
    // validation
    if (taskLink && task.link !== taskLink) {
      const isLink = linkSchema.safeParse(taskLink);
      if (!isLink.success) {
        console.log("getting called");
        setTaskLinkError("Invalid Link");
        return;
      }
    }

    recentTaskContext?.setTasks([task]); // keep track of this task for rollback later if undone

    if (task.title !== taskTitle) {
      updateTaskTitle.mutate({ title: taskTitle, taskId: task.id });
    }

    if (task.description !== taskDescription) {
      updateTaskDescription.mutate({
        description: taskDescription,
        taskId: task.id,
      });
    }

    if (task.link !== taskLink) {
      updateTaskLink.mutate({
        link: taskLink,
        taskId: task.id,
      });
    }

    if (task.priority !== taskPriority) {
      updateTaskPriority.mutate({ priority: taskPriority, taskId: task.id });
    }

    if (task.assignedTo !== taskAssignedTo) {
      updateAssignedTo.mutate({ username: taskAssignedTo, taskId: task.id });
    }

    setEditMode(false);
    setTaskLinkError("");

    actionContext?.setAction("edited");
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
      onClick={(e) => {
        if (updateAssignedTo.isLoading || updateTaskDescription.isLoading || updateTaskLink.isLoading || updateTaskPriority.isLoading || updateTaskTitle.isLoading || deleteTask.isLoading) {
          e.stopPropagation();
        } else {
          setTaskDetailsModal(false)
        }
      }
      } // Close when clicking backdrop
    >
      <div
        className="bg-[#464646] rounded-lg shadow-xl p-4 md:p-6 w-[90%] md:w-full md:max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <div className="flex justify-between items-center w-full gap-4">
          <div className="flex gap-x-2 text-2xl font-bold flex-1 min-w-0">
            <h1 className="shrink-0 text-sm md:text-lg">
              [{task.projectTaskId}]
            </h1>
            {editMode ? (
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full text-xs md:text-lg"
              />
            ) : (
              <h1
                className="truncate w-full text-sm md:text-lg"
                title={task.title}
              >
                {task.title}
              </h1>
            )}
          </div>
          <button
            onClick={() => setTaskDetailsModal(false)}
            className="bg-white/20 text-white text-xs md:text-sm font-semibold px-4 py-1 rounded-md cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
        <div>
          <h3
            className={`font-semibold text-xs md:text-sm ${editMode ? "text-xs pb-1" : ""}`}
          >
            Description:
          </h3>
          {editMode ? (
            <textarea
              className="w-full text-xs md:text-sm"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
          ) : (
            <h3 className="pl-4 text-xs md:text-sm">
              {task?.description ?? ""}
            </h3>
          )}
        </div>
        <div>
          <h3
            className={`font-semibold text-xs md:text-sm ${editMode ? "text-xs pb-1" : ""}`}
          >
            Link:
          </h3>
          {
            editMode ? (
              <input
                className="w-full text-xs md:text-sm"
                value={taskLink}
                onChange={(e) => setTaskLink(e.target.value)}
              />
            ) : task?.link && (
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-xs md:text-sm pl-4"
              >
                {task?.link ?? ""}
              </a>
            ) 
          }
          {taskLinkError !== "" && (
            <h4 className={`font-semibold text-xs text-red-400`}>
              {taskLinkError}
            </h4>
          )}
        </div>
        <div>
          <h3
            className={`font-semibold text-xs md:text-sm ${editMode ? "text-xs pb-1" : ""}`}
          >
            Priority:
          </h3>
          {editMode ? (
            <div className="flex w-full gap-x-2">
              {priorityLevels.map((p) => (
                <button
                  key={p}
                  onClick={() => setTaskPriority(p)}
                  type="button"
                  className={`${taskPriority === p ? "bg-white/40" : "bg-white/20"} text-xs md:text-base flex-1 rounded-md py-1 hover:bg-white/40 cursor-pointer`}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <span className="flex items-center pl-4 gap-x-2">
              <TaskPriority priority={task.priority} />
              <h3 className="text-xs md:text-sm">{task.priority}</h3>
            </span>
          )}
        </div>
        <div>
          <div className="flex justify-between items-center">
            <h3
              className={`font-semibold text-xs md:text-sm ${editMode ? "text-xs pb-1" : ""}`}
            >
              Assigned To:
            </h3>
            {!editMode && task.assignedTo !== username && (
              <button
                onClick={handleAssignToMe}
                className="font-semibold underline text-xs md:text-sm cursor-pointer disabled:cursor-not-allowed"
                disabled={updateAssignedTo.isLoading}
              >
                {!updateAssignedTo.isLoading ? (
                  "Assign To Me"
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
            )}
          </div>
          {editMode ? (
            <select
              id="assignTo"
              className="w-full text-xs md:text-base"
              value={taskAssignedTo}
              onChange={(e) => setTaskAssignedTo(e.target.value)}
            >
              {!usersLoading &&
                usersInProject?.map((u) => (
                  <option
                    key={u}
                    value={u}
                    className="bg-[#464646] text-xs md:text-base"
                  >
                    {u} {u === username ? "(You)" : ""}
                  </option>
                ))}
            </select>
          ) : (
            <h3 className="pl-4 text-xs md:text-sm">
              {task.assignedTo} {task.assignedTo === username ? "(You)" : ""}
            </h3>
          )}
        </div>
        <div className="flex flex-col gap-y-2">
          {editMode ? (
            <button
              onClick={handleSaveTask}
              className="bg-green-400 w-full text-white text-xs md:text-sm font-semibold py-2 rounded-md cursor-pointer disabled:cursor-not-allowed"
              disabled={updateAssignedTo.isLoading || updateTaskDescription.isLoading || updateTaskLink.isLoading || updateTaskPriority.isLoading || updateTaskTitle.isLoading}
            >
              {(!updateAssignedTo.isLoading && !updateTaskDescription.isLoading && !updateTaskLink.isLoading && !updateTaskPriority.isLoading && !updateTaskTitle.isLoading) ? (
                "Save"
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
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-white/20 w-full text-white text-xs md:text-sm font-semibold py-2 rounded-md cursor-pointer"
            >
              Edit
            </button>
          )}
          {!editMode && (
            <button
              onClick={handleDeleteTask}
              className="bg-red-400 w-full text-white text-xs md:text-sm font-semibold py-2 rounded-md cursor-pointer disabled:cursor-not-allowed"
              disabled={deleteTask.isLoading}
            >
              {!deleteTask.isLoading ? (
                "Delete"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
