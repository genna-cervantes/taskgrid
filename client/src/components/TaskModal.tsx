import React, { useContext, useRef, useState } from "react";
import { Task } from "../../../server/src/shared/types";
import { trpc } from "../utils/trpc";
import { priorityLevels } from "./AddTaskForm";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import { z } from "zod";
import SelectAssignee from "./SelectAssignee";
import TaskImageModal from "./TaskImageModal";

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

  const inputFileRef = useRef<HTMLInputElement>(null);

  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskDescription, setTaskDescription] = useState(task.description);
  const [taskPriority, setTaskPriority] = useState(task.priority);
  const [taskAssignedTo, setTaskAssignedTo] = useState(task.assignedTo);
  const [taskLink, setTaskLink] = useState(task.link);

  const [taskImagesHasInitialized, setTaskImagesHasInitialized] =
    useState(false);
  const [taskImageUrls, setTaskImagesUrls] = useState<
    { url: string; key: string }[]
  >([]);
  const [uploadTaskImagesIsLoading, setUploadTaskImagesIsLoading] =
    useState(false);

  const [taskLinkError, setTaskLinkError] = useState("");
  const [taskMediaError, setTaskMediaError] = useState("");
  const [taskAsssignedToError, setTaskAssignedToError] = useState("");

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]); // empty at first talaga

  const [imageModalState, setImageModalState] = useState<{
    visible: boolean;
    url: string;
    index: number;
    deleteFunction:
      | ((url: string, index: number) => void)
      | ((url: string) => void);
  } | null>(null);

  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);

  const { data: usersInProject } = trpc.getUsernamesInProject.useQuery({
    id: projectId,
  });

  const { isLoading: taskImageUrlsIsLoading } = trpc.getTaskImages.useQuery(
    { taskId: task.id, projectId, keys: task.files },
    {
      enabled: !!task && !taskImagesHasInitialized,
      onSuccess: (data) => {
        setTaskImagesUrls(data ?? []);
        setTaskImagesHasInitialized(true);
      },
    }
  );

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

  const handleClickUpload = () => {
    if (previewUrls.length + (taskImageUrls?.length ?? 3) < 3) {
      // better not allowed when task images are still loading
      inputFileRef.current?.click();
    } else {
      alert("Maximum of 3 images allowed.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE_MB = 2;
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files).slice(0, 3 - previewUrls.length);
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setTaskMediaError(
          `${file.name} is too large (max ${MAX_FILE_SIZE_MB}MB)`
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  // removing file functions
  // one for preview: just uploaded
  const removePreview = (url: string, index: number) => {
    setPreviewUrls((prev) => prev.filter((u) => u !== url));
    setFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(url);
  };

  // one for previous: from s3 already
  const removeTaskImage = (url: string) => {
    setTaskImagesUrls((prev) => prev.filter((u) => u.url != url));
  };

  const showImage = (
    url: string,
    index: number,
    deleteFunction:
      | ((url: string, index: number) => void)
      | ((url: string) => void)
  ) => {
    setImageModalState({
      visible: true,
      url,
      index,
      deleteFunction,
    });
  };

  const remainingSlots =
    3 - (previewUrls.length + (taskImageUrls?.length ?? 3));

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
        className="dark:bg-light dark:border-faintWhite/5 border-[1px] bg-lmLightBackground rounded-lg shadow-xl p-4 md:p-6 w-[90%] md:w-full md:max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <div className="flex justify-between items-center w-full gap-4">
          <div className="flex gap-x-2 text-2xl font-bold flex-1 min-w-0">
            <h1 className="shrink-0 text-lg">[{task.projectTaskId}]</h1>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full text-lg"
            />
          </div>
          <button
            onClick={() => setTaskDetailsModal(false)}
            className="bg-faintWhite text-white text-sm font-semibold px-4 py-1 rounded-md cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
        <div>
          <h3 className={`font-semibold text-sm transition-all duration-100 `}>
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
          <h3 className={`font-semibold text-sm transition-all duration-100`}>
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
          <h3 className={`font-semibold text-sm transition-all duration-100`}>
            Media:
          </h3>

          <div className="flex w-full gap-x-2 h-12 mt-1">
            {taskImageUrlsIsLoading || taskImageUrls == undefined ? (
              <p>Loading...</p>
            ) : (
              <>
                {/* loop thru media images from s3 */}
                {taskImageUrls?.map((url) => (
                  <div
                    key={url.url}
                    className="group/image relative w-1/3 rounded-md overflow-hidden"
                  >
                    <button
                      className="hidden group-hover/image:flex absolute inset-0 items-center justify-center bg-black/50 text-white text-sm z-10 cursor-pointer"
                      // onClick={() => removeTaskImage(url.url)}
                      onClick={() => showImage(url.url, 0, removeTaskImage)}
                    >
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
                      src={url.url}
                      alt="Task image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {/* // loop thru previewUrls */}
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="group/upload relative h-12 w-1/3 overflow-hidden rounded shadow"
                  >
                    <img
                      src={url}
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => showImage(url, idx, removePreview)}
                      // onClick={() => removePreview(url, idx)}
                      className="hidden group-hover/upload:flex absolute top-0 left-0 w-full h-full bg-black/50 text-fadedWhite justify-center items-center text-xs px-1 rounded-bl"
                    >
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
                        className="lucide lucide-circle-minus-icon lucide-circle-minus"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
            {taskImageUrls != undefined &&
            !taskImageUrlsIsLoading &&
            previewUrls.length + taskImageUrls.length < 3 ? ( // combined preview and s3
              <>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={inputFileRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={handleClickUpload}
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
              </>
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
            {username && !task.assignedTo.includes(username) && (
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
    </div>
  );
};

export default TaskModal;
