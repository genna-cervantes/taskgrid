import React, { useContext, useEffect, useRef, useState } from "react";
import { Task } from "../../../server/src/shared/types";
import { trpc } from "../utils/trpc";
import { priorityLevels } from "./AddTaskForm";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import { z } from "zod";
import TaskImageModal from "./TaskImageModal";
import { ChevronsRight, Minus } from "lucide-react";
import TaskDiscussionBoard from "./TaskDiscussionBoard";
import TaskSelectCategory from "./TaskSelectCategory";
import TaskDescription from "./TaskDescription";
import TaskSelectPriority from "./TaskSelectPriority";
import TaskTargetDates from "./TaskTargetDates";
import TaskAssignee from "./TaskAssignee";
import TaskSelectMedia from "./TaskSelectMedia";
import TaskLink from "./TaskLink";
import Mousetrap from 'mousetrap';
import { useNavigate } from "react-router-dom";

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

  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskDescription, setTaskDescription] = useState(task.description);
  const [taskPriority, setTaskPriority] = useState(task.priority);
  const [taskAssignedTo, setTaskAssignedTo] = useState(task.assignedTo);
  const [taskLink, setTaskLink] = useState(task.link);
  const [taskTargetStartDate, setTaskTargetStartDate] = useState<
    Date | undefined
  >(task.targetStartDate);
  const [taskTargetEndDate, setTaskTargetEndDate] = useState<Date | undefined>(
    task.targetEndDate
  );
  const [taskCategory, setTaskCategory] = useState(task.category);

  const [uploadTaskImagesIsLoading, setUploadTaskImagesIsLoading] =
    useState(false);

  const [taskLinkError, setTaskLinkError] = useState("");
  const [taskMediaError, setTaskMediaError] = useState("");
  const [taskAssignedToError, setTaskAssignedToError] = useState("");
  const [taskTargetDateError, setTaskTargetDateError] = useState("");

  const [files, setFiles] = useState<File[]>([]); // empty at first talaga
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [taskImageUrls, setTaskImagesUrls] = useState<
        { url: string; key: string }[]
      >([]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [openDiscussion, setOpenDiscussion] = useState(false);

  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);

  const [imageModalState, setImageModalState] = useState<{
              visible: boolean;
              url: string;
              index: number;
              deleteFunction:
                | ((url: string, index: number) => void)
                | ((url: string) => void);
            } | null>(null);
  

  // useEffect(() => {
  //   setTaskImagesUrls(taskImageUrlsFromQuery ?? []);
  // }, [taskImageUrlsFromQuery, taskImageUrlsIsLoading])

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

  const updateTaskTargetStartDate = trpc.updateTaskTargetStartDate.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskTargetEndDate = trpc.updateTaskTargetEndDate.useMutation({
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

  const handleSaveTask = async () => {
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

    if (previewUrls.length + taskImageUrls.length > 3) {
      setTaskMediaError(
        "Upload limit of 3 has been exceeded, please remove a file or refresh the page"
      );
      return;
    }

    if (
      taskTargetStartDate &&
      taskTargetEndDate &&
      taskTargetStartDate > taskTargetEndDate
    ) {
      setTaskTargetDateError(
        "Target start date cannot be later than target end date"
      );
      return;
    }

    // end validation

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

    if (taskTargetStartDate && task.targetStartDate !== taskTargetStartDate) {
      updateTaskTargetStartDate.mutate({
        taskId: task.id,
        projectId,
        targetStartDate: taskTargetStartDate.toString(),
      });
    }

    if (taskTargetEndDate && task.targetEndDate !== taskTargetEndDate) {
      updateTaskTargetEndDate.mutate({
        taskId: task.id,
        projectId,
        targetEndDate: taskTargetEndDate.toString(),
      });
    }

    // for media - add checker if something actually changed tho
    await handleUpload(task.id);

    utils.getTasks.invalidate();
    setTaskDetailsModal(false);
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

  const getUploadUrls = trpc.uploadTaskImages.useMutation();

  // called on save to save updates to images
  const handleUpload = async (taskId: string) => {
    setUploadTaskImagesIsLoading(true);
    const response = await getUploadUrls.mutateAsync({
      projectId,
      taskId,
      previousKeys: taskImageUrls.map((t) => t.key),
      files: files.map((file) => ({
        name: file.name.split(".")[0],
        type: file.type,
      })),
    });

    await Promise.all(
      response.files.map(async ({ url, key }, index) => {
        const file = files[index];

        // Upload file to S3 using the signed URL
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!res.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        return { name: file.name, key };
      })
    );

    setUploadTaskImagesIsLoading(false);
  };

  const navigate = useNavigate()
  const joinDiscussionRef = useRef<HTMLTextAreaElement>(null);

  // keyboard shortcuts
  useEffect(() => {
    Mousetrap.bind('ctrl+d', function(e) {
      e.preventDefault();
      setOpenDiscussion(!openDiscussion)
    });
    
    Mousetrap.bind('ctrl+o', function(e) {
      e.preventDefault();
      navigate(`tasks/${task.id}`)
    });

    Mousetrap.bind('ctrl+j', function(e) {
      e.preventDefault();
      setOpenDiscussion(!openDiscussion)
      joinDiscussionRef.current?.focus()
    });
    
    return () => {
      Mousetrap.unbind('ctrl+s');
      Mousetrap.unbind('g h');
    };
  }, []);

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
          deleteTask.isLoading ||
          imageModalState?.visible
        ) {
          e.stopPropagation();
        } else {
          setTaskDetailsModal(false);
        }
      }} // Close when clicking backdrop
    >
      {imageModalState?.visible && (
        <TaskImageModal
          url={imageModalState.url}
          index={imageModalState.index}
          setDisplayImage={(s: boolean) => {
            setImageModalState((prev) => {
              if (!prev) return null; // or whatever makes sense if modal is closed
              return { ...prev, visible: s };
            });
          }}
          handleDelete={imageModalState.deleteFunction}
        />
      )}
      <div
        className={`h-[87%] dark:bg-backgroundDark dark:border-faintWhite/5 border-[1px] bg-lmLightBackground rounded-lg shadow-xl p-4 md:p-6 w-[90%] ${openDiscussion ? "md:max-w-5xl" : "md:max-w-2xl"} flex h-auto transition-all duration-200 ease-in-out`}
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <div
          className={`flex h-full justify-between flex-col gap-y-4 ${openDiscussion ? "w-1/2" : "w-full"}`}
        >
          <div className="flex justify-between items-center w-full gap-4">
            <div className="flex gap-x-2 text-2xl font-bold flex-1 min-w-0">
              <h1 className="shrink-0 text-lg">[{task.projectTaskId}]</h1>
              <div className="w-full text-lg min-h-14">
                {isEditingTitle ? (
                  <textarea
                    autoFocus
                    value={taskTitle}
                    onBlur={() => setIsEditingTitle(false)}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full h-12 resize-none scrollbar-none focus:border-midWhite/50"
                  />
                ) : (
                  <div
                    onClick={() => setIsEditingTitle(true)}
                    className="cursor-text w-full h-14 line-clamp-2 overflow-hidden"
                  >
                    {taskTitle}
                  </div>
                )}
              </div>
            </div>
          </div>
          <TaskDescription taskDescription={taskDescription} setTaskDescription={setTaskDescription} />
          <TaskSelectCategory taskCategoryOptions={[]} taskCategory={taskCategory} setTaskCategory={setTaskCategory} />
          <TaskTargetDates taskTargetStartDate={taskTargetStartDate} taskTargetEndDate={taskTargetEndDate} setTaskTargetStartDate={setTaskTargetStartDate} setTaskTargetEndDate={setTaskTargetEndDate} taskTargetDateError={taskTargetDateError} />
          <TaskLink taskLink={taskLink} setTaskLink={setTaskLink} taskLinkError={taskLinkError} />
          <TaskSelectMedia task={task} projectId={projectId} taskMediaError={taskMediaError} setTaskMediaError={setTaskMediaError} previewUrls={previewUrls} setPreviewUrls={setPreviewUrls} taskImageUrls={taskImageUrls} setTaskImagesUrls={setTaskImagesUrls} setFiles={setFiles} setImageModalState={setImageModalState} />
          <TaskSelectPriority priorityLevels={priorityLevels} taskPriority={taskPriority} setTaskPriority={setTaskPriority} />
          <TaskAssignee projectId={projectId} username={username} taskAssignedTo={taskAssignedTo} setTaskAssignedTo={setTaskAssignedTo} taskAssignedToError={taskAssignedToError} />
          <div className="flex flex-col md:flex-row gap-y-2 md:gap-x-4 mt-4">
            <button
              onClick={handleSaveTask}
              className="bg-green-400 w-full flex justify-center items-center text-white text-sm font-semibold py-[0.35rem] rounded-md cursor-pointer disabled:cursor-not-allowed"
              disabled={
                updateAssignedTo.isLoading ||
                updateTaskDescription.isLoading ||
                updateTaskLink.isLoading ||
                updateTaskPriority.isLoading ||
                updateTaskTitle.isLoading ||
                uploadTaskImagesIsLoading
              }
            >
              {!updateAssignedTo.isLoading &&
              !updateTaskDescription.isLoading &&
              !updateTaskLink.isLoading &&
              !updateTaskPriority.isLoading &&
              !updateTaskTitle.isLoading &&
              !uploadTaskImagesIsLoading ? (
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

            <button
              onClick={handleDeleteTask}
              className="bg-red-400 w-full text-white text-sm py-[0.35rem] font-semibold rounded-md cursor-pointer disabled:cursor-not-allowed"
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
          </div>
        </div>
        {!openDiscussion && (
          <div
            className={`items-center flex ml-4 relative w-fit justify-start  cursor-pointer group/expand-toggle`}
            title="open discussion"
            onClick={() => setOpenDiscussion(!openDiscussion)}
          >
            <button type="button" className="text-midWhite">
              <Minus className="h-8 rotate-90 transition-all duration-300 ease-in-out opacity-100 group-hover/expand-toggle:opacity-0 group-hover/expand-toggle:scale-95 absolute" />
              <ChevronsRight className="h-8 transition-all duration-300 ease-in-out opacity-0 group-hover/expand-toggle:opacity-100 group-hover/expand-toggle:scale-105 transform translate-x-0 group-hover/expand-toggle:translate-x-1" />
            </button>
          </div>
        )}
        {openDiscussion && (
          <>
            <div className="w-px bg-faintWhite/5 mx-6 h-full"></div>
            <TaskDiscussionBoard ref={joinDiscussionRef} taskId={task.id} user={username ?? ""} />
          </>
        )}
      </div>
    </div>
  );
};

export default TaskModal;
