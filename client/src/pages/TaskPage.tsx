import LoadingModal from "@/components/LoadingModal";
import TaskDescription from "@/components/TaskDescription";
import TaskSelectCategory from "@/components/TaskSelectCategory";
import TaskSelectPriority from "@/components/TaskSelectPriority";
import { trpc } from "@/utils/trpc";
import { useContext, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { priorityLevels } from "@/components/AddTaskForm";
import TaskTargetDates from "@/components/TaskTargetDates";
import { Task } from "../../../server/src/shared/types";
import TaskAssignee from "@/components/TaskAssignee";
import { useUserContext } from "@/contexts/UserContext";
import TaskSelectMedia from "@/components/TaskSelectMedia";
import TaskImageModal from "@/components/TaskImageModal";
import TaskLink from "@/components/TaskLink";
import TaskDiscussionBoard from "@/components/TaskDiscussionBoard";
import Mousetrap from "mousetrap";
import { ActionContext } from "@/contexts/ActionContext";
import { RecentTaskContext } from "@/contexts/RecentTaskContext";
import { linkSchema } from "@/components/TaskModal";
import TaskTitle from "@/components/TaskTitle";
import TaskDependsOn from "@/components/TaskDependsOn";
import TaskSubtasks from "@/components/TaskSubtasks";

const TaskPage = () => {
  const { projectId: projectIdParam, taskId: taskIdParam } = useParams();
  const projectId = projectIdParam ?? "";
  const taskId = taskIdParam ?? "";

  const joinDiscussionRef = useRef<HTMLTextAreaElement>(null);

  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const saveBtnRef = useRef<HTMLButtonElement>(null)

  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);

  const userContext = useUserContext();
  const { data: username } =
    trpc.getUsername.useQuery({
      id: projectId,
      guestId: userContext.userId ?? "",
    });

  const { data, isLoading: taskDataIsLoading } = trpc.getTaskById.useQuery({
    projectId,
    taskId: taskId,
  });

  const { data: taskCategoryOptionsRes } = trpc.getTaskCategoryOptions.useQuery(
    { projectId }
  );

  const task: Task | undefined = data
    ? {
        ...data,
        targetStartDate: data.targetStartDate
          ? new Date(data.targetStartDate)
          : undefined,
        targetEndDate: data.targetEndDate
          ? new Date(data.targetEndDate)
          : undefined,
      }
    : undefined;

  const [isInitialized, setIsInitialized] = useState(false);
  const [taskTitle, setTaskTitle] = useState(task?.title);
  const [taskDescription, setTaskDescription] = useState(task?.description);
  const [taskCategory, setTaskCategory] = useState(task?.category);
  const [taskPriority, setTaskPriority] = useState(task?.priority);
  const [taskAssignedTo, setTaskAssignedTo] = useState(task?.assignedTo ?? []);
  const [taskLink, setTaskLink] = useState(task?.link);
  const [taskTargetStartDate, setTaskTargetStartDate] = useState<
    Date | undefined
  >(task?.targetStartDate);
  const [taskTargetEndDate, setTaskTargetEndDate] = useState<Date | undefined>(
    task?.targetEndDate
  );
  const [taskDependsOn, setTaskDependsOn] = useState(task?.dependsOn ?? []);
  const [taskSubtasks, setTaskSubtasks] = useState(task?.subtasks ? [...task.subtasks, {title: "", isDone: false}] : []);

  const [taskCategoryOptions, setTaskCategoryOptions] = useState(
    taskCategoryOptionsRes ?? []
  );

  const [taskTargetDateError, setTaskTargetDateError] = useState("");
  const [taskAssignedToError, setTaskAssignedToError] = useState("");
  const [taskMediaError, setTaskMediaError] = useState("");
  const [taskLinkError, setTaskLinkError] = useState("");

  const getUploadUrls = trpc.uploadTaskImages.useMutation();

  const [uploadTaskImagesIsLoading, setUploadTaskImagesIsLoading] =
    useState(false);

  const [files, setFiles] = useState<File[]>([]); // empty at first talaga
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [taskImageUrls, setTaskImagesUrls] = useState<
    { url: string; key: string }[]
  >([]);

  const [imageModalState, setImageModalState] = useState<{
    visible: boolean;
    url: string;
    index: number;
    deleteFunction:
      | ((url: string, index: number) => void)
      | ((url: string) => void);
  } | null>(null);

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

  // TRPC METHODS
  const deleteTask = trpc.deleteTask.useMutation({
    onSuccess: (data) => {
      console.log("Task deleted:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateAssignedTo = trpc.updateAssignedTo.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskTitle = trpc.updateTaskTitle.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskDescription = trpc.updateTaskDescription.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskLink = trpc.updateTaskLink.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskPriority = trpc.updateTaskPriority.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskTargetStartDate = trpc.updateTaskTargetStartDate.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskTargetEndDate = trpc.updateTaskTargetEndDate.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskCategory = trpc.updateTaskCategory.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });
  
  const updateTaskDependsOn = trpc.updateTaskDependsOn.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  })
  
  const updateTaskSubtasks = trpc.updateTaskSubtasks.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    }    
  })

  const updateTaskCategoryOptions = trpc.updateTaskCategoryOptions.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: taskId, projectId: projectId });
      utils.getTaskCategoryOptions.invalidate({ projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });


  // HANDLE METHODS

  const handleDeleteTask = () => {
    if (task == null) return;

    recentTaskContext?.setTasks([task]); // keep track of this task for insertion later if undone

    deleteTask.mutate({ taskId: task.id });
    navigate(`/projects/${projectId}`);

    actionContext?.setAction("deleted");
  };

  const handleSaveTask = async () => {
    if (task == null) return;
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

    if (taskTitle && task.title !== taskTitle) {
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

    if (taskPriority && task.priority !== taskPriority) {
      updateTaskPriority.mutate({ priority: taskPriority, taskId: task.id });
    }

    if (task.assignedTo !== taskAssignedTo) {
      updateAssignedTo.mutate({ assignTo: taskAssignedTo, taskId: task.id });
    }

    if (task.targetStartDate !== taskTargetStartDate) {
      updateTaskTargetStartDate.mutate({
        taskId: task.id,
        projectId,
        targetStartDate: taskTargetStartDate?.toString(),
      });
    }

    if (task.targetEndDate !== taskTargetEndDate) {
      updateTaskTargetEndDate.mutate({
        taskId: task.id,
        projectId,
        targetEndDate: taskTargetEndDate?.toString(),
      });
    }

    if (task.category !== taskCategory) {
      updateTaskCategory.mutate({
        taskId: task.id,
        projectId,
        category: taskCategory,
      });
    }

    // array similarity dapat toh eh
    if (taskDependsOn !== task.dependsOn){
      updateTaskDependsOn.mutate({
        projectId,
        taskId: task.id,
        dependsOn: taskDependsOn ?? []
      })
    }

    if (taskSubtasks !== task.subtasks){
      updateTaskSubtasks.mutate({
        projectId,
        taskId: task.id,
        subtasks: taskSubtasks
      })
    }

    updateTaskCategoryOptions.mutate({
      projectId,
      taskCategoryOptions,
    });

    // for media - add checker if something actually changed tho
    await handleUpload(task.id);

    utils.getTaskById.invalidate();
    setTaskLinkError("");
    setTaskAssignedToError("");

    actionContext?.setAction("edited");
  };

  useEffect(() => {
    if (task && !isInitialized) {
      setTaskTitle(task.title);
      setTaskDescription(task.description);
      setTaskCategory(task.category);
      setTaskPriority(task.priority);
      setTaskAssignedTo(task.assignedTo ?? []);
      setTaskLink(task.link);
      setTaskTargetStartDate(task.targetStartDate);
      setTaskTargetEndDate(task.targetEndDate);
      setTaskDependsOn(task.dependsOn);
      setTaskSubtasks(task.subtasks ? [...task.subtasks, {title: "", isDone: false}] : []);
      setIsInitialized(true);
    }
  }, [task, isInitialized]);

  useEffect(() => {
    Mousetrap.prototype.stopCallback = function () {
      return false; // allow all shortcuts to trigger
    };

    Mousetrap.bind("ctrl+j", function (e) {
      e.preventDefault();
      joinDiscussionRef.current?.focus();
    });

    Mousetrap.bind("ctrl+s", function (e) {
      e.preventDefault();
       saveBtnRef.current?.focus();
       saveBtnRef.current?.click();
    });

    Mousetrap.bind("esc", function (e) {
      e.preventDefault();
      navigate(`/projects/${projectId}`);
    });

    return () => {
      Mousetrap.unbind("ctrl+s");
      Mousetrap.unbind("ctrl+j");
      Mousetrap.unbind("esc");
    };
  }, []);

  if (task == null && !taskDataIsLoading) {
    return <Navigate to="/404" replace />;
  }

  if (taskDataIsLoading || task == undefined) {
    console.log("loading");
    return <LoadingModal />;
  }

  return (
    <div className="w-full h-screen flex">
      <div className="scrollbar-group w-[60%] h-full">
        <div className="group-hover-scrollbar w-full px-4 flex flex-col gap-y-4 max-h-screen overflow-y-scroll super-thin-scrollbar">
          <TaskTitle
            isPage={true}
            taskTitle={taskTitle}
            setTaskTitle={setTaskTitle}
          />
          <TaskDescription
            isPage={true}
            taskDescription={taskDescription}
            setTaskDescription={setTaskDescription}
          />
          <TaskSelectCategory
            isPage={true}
            taskCategoryOptions={taskCategoryOptions}
            setTaskCategoryOptions={setTaskCategoryOptions}
            taskCategory={taskCategory}
            setTaskCategory={setTaskCategory}
          />
          <TaskSelectPriority
            isPage={true}
            priorityLevels={priorityLevels}
            taskPriority={taskPriority}
            setTaskPriority={setTaskPriority}
          />
          <TaskTargetDates
            isPage={true}
            taskTargetStartDate={taskTargetStartDate}
            taskTargetEndDate={taskTargetEndDate}
            setTaskTargetStartDate={setTaskTargetStartDate}
            setTaskTargetEndDate={setTaskTargetEndDate}
            taskTargetDateError={taskTargetDateError}
          />
          <TaskAssignee
            isPage={true}
            projectId={projectId}
            username={username}
            taskAssignedTo={taskAssignedTo}
            setTaskAssignedTo={setTaskAssignedTo}
            taskAssignedToError={taskAssignedToError}
          />
          {task && (
            <TaskSelectMedia
              isPage={true}
              task={task}
              projectId={projectId}
              taskMediaError={taskMediaError}
              setTaskMediaError={setTaskMediaError}
              previewUrls={previewUrls}
              setPreviewUrls={setPreviewUrls}
              taskImageUrls={taskImageUrls}
              setTaskImagesUrls={setTaskImagesUrls}
              setFiles={setFiles}
              setImageModalState={setImageModalState}
            />
          )}
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
          <TaskLink
            isPage={true}
            taskLink={taskLink}
            setTaskLink={setTaskLink}
            taskLinkError={taskLinkError}
          />
          <div className="flex items-center gap-x-4">
            <hr className="flex-grow border-t border-faintWhite" />
            <p className="text-xs text-center text-faintWhite whitespace-nowrap">
              Advanced Task Details
            </p>
            <hr className="flex-grow border-t border-faintWhite" />
          </div>
          <TaskDependsOn isPage={true} taskId={task.id} projectId={projectId} taskDependsOn={taskDependsOn} setTaskDependsOn={setTaskDependsOn} />
          <TaskSubtasks isPage={true} taskSubtasks={taskSubtasks} setTaskSubtasks={setTaskSubtasks} />
          <div className="">
            <h3
              className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
            >
              Personal Notes:
            </h3>
            <textarea
              placeholder="Notes only you can see"
              className={`w-full text-base h-24 placeholder:text-faintWhite shadow-bottom-grey focus:outline-none focus:ring-0 focus:border-transparent`}
              value=""
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>
          <div className="mb-16 flex gap-x-4">
            <button
              onClick={handleSaveTask}
              ref={saveBtnRef}
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
      <div className="w-[40%] px-6 h-screen">
        <TaskDiscussionBoard
          ref={joinDiscussionRef}
          isPage={true}
          user={username}
          taskId={task.id}
        />
      </div>
    </div>
  );
};

export default TaskPage;
