import React, { useContext, useState } from "react";
import { Task } from "../../../server/src/shared/types";
import { trpc } from "../utils/trpc";
import { priorityLevels } from "./AddTaskForm";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import { z } from "zod";
import SelectAssignee from "./SelectAssignee";

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
  const [taskMediaError, setTaskMediaError] = useState("");
  const [taskAsssignedToError, setTaskAssignedToError] = useState("");

  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);

  const { data: usersInProject } = trpc.getUsernamesInProject.useQuery({
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
    // check if may changes para wag n mag toast if wala naman

    // validation
    if (taskLink && task.link !== taskLink) {
      const isLink = linkSchema.safeParse(taskLink);
      if (!isLink.success) {
        setTaskLinkError("Invalid Link");
        return;
      }
    }

    if (taskAssignedTo.length < 1) {
      setTaskAssignedToError("At least one assignee is required");
      return;
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
      updateAssignedTo.mutate({ assignTo: taskAssignedTo, taskId: task.id });
    }

    setEditMode(false);
    setTaskLinkError("");
    setTaskAssignedToError("");

    actionContext?.setAction("edited");
  };

  const handleAssignToMe = async () => {
    // check if name is set in storage
    if (username) {
      // update assigned to
      updateAssignedTo.mutate({ taskId: task.id, assignTo: [username] });
    } else {
      setTaskDetailsModal(false);
      setUsernameModal(true);
    }
  };

  console.log("task", task);

  const { data: taskImageUrls, isLoading: taskImageUrlsIsLoading } =
    trpc.getTaskImages.useQuery(
      { taskId: task.id, projectId, keys: task.files },
      { enabled: !!task }
    );

  const remainingSlots = 3 - (taskImageUrls?.length ?? 3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (
          updateAssignedTo.isLoading ||
          updateTaskDescription.isLoading ||
          updateTaskLink.isLoading ||
          updateTaskPriority.isLoading ||
          updateTaskTitle.isLoading ||
          deleteTask.isLoading
        ) {
          e.stopPropagation();
        } else {
          setTaskDetailsModal(false);
        }
      }} // Close when clicking backdrop
    >
      <div
        className="dark:bg-light bg-lmLightBackground rounded-lg shadow-xl p-4 md:p-6 w-[90%] md:w-full md:max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <div className="flex justify-between items-center w-full gap-4">
          <div className="flex gap-x-2 text-2xl font-bold flex-1 min-w-0">
            <h1 className="shrink-0 text-lg">[{task.projectTaskId}]</h1>
            {editMode ? (
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full text-lg"
              />
            ) : (
              <h1 className="truncate w-full text-lg" title={task.title}>
                {task.title}
              </h1>
            )}
          </div>
          <button
            onClick={() => setTaskDetailsModal(false)}
            className="bg-faintWhite text-white text-sm font-semibold px-4 py-1 rounded-md cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
        <div>
          <h3
            className={`font-semibold text-sm transition-all duration-100 ${editMode ? "text-xs pb-1" : ""}`}
          >
            Description:
          </h3>
          <textarea
            placeholder="What's this about?"
            className="w-full text-sm md:text-base"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
          />
        </div>
        <div>
          <h3
            className={`font-semibold text-sm transition-all duration-100 ${editMode ? "text-xs pb-1" : ""}`}
          >
            Link:
          </h3>

          <input
            placeholder="https://"
            className="w-full text-sm md:text-base"
            value={taskLink}
            onChange={(e) => setTaskLink(e.target.value)}
          />

          {taskLinkError !== "" && (
            <h4 className={`font-semibold text-xs text-red-400`}>
              {taskLinkError}
            </h4>
          )}
        </div>
        <div>
          <h3
            className={`font-semibold text-sm transition-all duration-100 ${
              editMode ? "text-xs pb-1" : ""
            }`}
          >
            Media:
          </h3>

          <div className="flex w-full gap-x-2 h-16 mt-1">
            {(taskImageUrlsIsLoading || taskImageUrls == undefined) ? (
              <p>Loading...</p>
            ) : (
              taskImageUrls?.map((url) => (
                <div
                  key={url}
                  className="group/image relative w-1/3 rounded-md overflow-hidden"
                >
                  <button className="hidden group-hover/image:flex absolute inset-0 items-center justify-center bg-black/50 text-white text-sm z-10 cursor-pointer">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-circle-minus-icon lucide-circle-minus opacity-50"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                      </svg>
                  </button>
                  <img
                    src={url}
                    alt="Task image"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            )}
            {taskImageUrls != undefined && taskImageUrls.length < 3 ? (
              <button
                type="button"
                // onClick={handleClickUpload}
                className={`border-2 border-midWhite px-4 py-[0.4rem] rounded-lg flex justify-center items-center ${
                  remainingSlots === 2
                    ? "w-2/3"
                    : remainingSlots === 1
                      ? "w-1/3"
                      : "w-full"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-upload-icon lucide-upload text-midWhite"
                >
                  <path d="M12 3v12" />
                  <path d="m17 8-5-5-5 5" />
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                </svg>
              </button>
            ) : (
              <></>
            )}
          </div>

          {taskMediaError !== "" && (
            <h4 className="font-semibold text-xs text-red-400">
              {taskMediaError}
            </h4>
          )}
        </div>

        <div>
          <h3 className={`font-semibold text-sm transition-all duration-100`}>
            Priority:
          </h3>
          <div className="flex w-full gap-x-2">
            <div className="flex w-full gap-x-2 mt-1">
              {priorityLevels.map((p) => (
                <button
                  key={p}
                  onClick={() => setTaskPriority(p)}
                  type="button"
                  className={`${
                    taskPriority === p
                      ? "bg-lmMidBackground dark:bg-midWhite text-fadedBlack dark:text-white"
                      : "bg-lmBackground/60"
                  } text-sm md:text-base  dark:bg-faintWhite dark:text-white text-fadedBlack flex-1 hover:bg-lmMidBackground dark:hover:bg-midWhite rounded-md py-1 cursor-pointer transition-colors`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <h3 className={`font-semibold text-sm transition-all duration-100`}>
              Assign to:
            </h3>
            {username && !editMode && !task.assignedTo.includes(username) && (
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
          <SelectAssignee
            setTaskAssignedTo={setTaskAssignedTo}
            taskAssignedTo={taskAssignedTo}
            username={username ?? ""}
            usersInProject={usersInProject ?? []}
          />
          {taskAsssignedToError !== "" && (
            <h4 className={`font-semibold text-xs text-red-400 mt-1`}>
              {taskAsssignedToError}
            </h4>
          )}
        </div>
        <div className="flex flex-col gap-y-2">
          <button
            onClick={handleSaveTask}
            className="bg-green-400 w-full text-white text-sm font-semibold py-1 rounded-md cursor-pointer disabled:cursor-not-allowed"
            disabled={
              updateAssignedTo.isLoading ||
              updateTaskDescription.isLoading ||
              updateTaskLink.isLoading ||
              updateTaskPriority.isLoading ||
              updateTaskTitle.isLoading
            }
          >
            {!updateAssignedTo.isLoading &&
            !updateTaskDescription.isLoading &&
            !updateTaskLink.isLoading &&
            !updateTaskPriority.isLoading &&
            !updateTaskTitle.isLoading ? (
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

          {!editMode && (
            <button
              onClick={handleDeleteTask}
              className="bg-red-400 w-full text-white text-sm py-1 font-semibold rounded-md cursor-pointer disabled:cursor-not-allowed"
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
