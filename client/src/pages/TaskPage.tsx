import LoadingModal from "@/components/LoadingModal";
import TaskDescription from "@/components/TaskDescription";
import TaskSelectCategory from "@/components/TaskSelectCategory";
import TaskSelectPriority from "@/components/TaskSelectPriority";
import { trpc } from "@/utils/trpc";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { priorityLevels } from "@/components/AddTaskForm";
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
import TaskTitle from "@/components/TaskTitle";
import TaskDependsOn from "@/components/TaskDependsOn";
import TaskSubtasks from "@/components/TaskSubtasks";
import BreadCrumbs from "@/components/BreadCrumbs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import TaskTargetStartDate from "@/components/TaskTargetStartDate";
import TaskTargetEndDate from "@/components/TaskTargetEndDate";
import { Loader2 } from "lucide-react";

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignTo: z.array(z.string()),
  progress: z.string(),
  link: z.string().url().optional(),
  category: z.string().optional(),
  files: z.array(z.string()),
  projectTaskId: z.number(),
  commentCount: z.number(),
  targetStartDate: z.date().optional(),
  targetEndDate: z.date().optional(),
  dependsOn: z.array(z.object({ id: z.string(), title: z.string() })),
  subtasks: z.array(z.object({ title: z.string(), isDone: z.boolean() })),
  index: z.number(),
}) satisfies z.ZodType<Task>;

export const TaskUpdateSchema = z
  .object({})
  .merge(TaskSchema.omit({ id: true }).partial());

export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

const TaskPage = () => {
  const {
    projectId: projectIdParam,
    taskId: taskIdParam,
    workspaceId,
  } = useParams();
  const projectId = projectIdParam ?? "";
  const taskId = taskIdParam ?? "";

  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);
  const userContext = useUserContext();

  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const joinDiscussionRef = useRef<HTMLTextAreaElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  // Use Queries -- should be in context workspaceContext userContext
  const { data: projectName, isLoading: projectNameIsLoading } =
    trpc.projects.getProjectNameByKey.useQuery(
      {
        id: projectId!,
      },
      { enabled: projectId !== "" }
    );

  const { data: workspaceName, isLoading: workspaceExistsIsLoading } =
    trpc.workspaces.checkWorkspaceId.useQuery(
      { workspaceId: workspaceId!, guestId: userContext.userId! },
      { enabled: !!userContext.userId && !!workspaceId }
    );

  // -- should be in user context
  const { data: username } =
    trpc.users.getUsername.useQuery(
      {
        id: projectId,
        guestId: userContext.userId!,
      },
      {
        enabled: !!userContext.userId,
      }
    );

  const { data: taskCategoryOptionsRes } =
    trpc.tasks.getTaskCategoryOptions.useQuery({ projectId });

  const { data, isLoading: taskDataIsLoading } =
    trpc.tasks.getTaskById.useQuery({
      projectId,
      taskId: taskId,
    });

  const task: Task | undefined = useMemo(
    () =>
      data
        ? {
            ...data,
            targetStartDate: data.targetStartDate
              ? new Date(data.targetStartDate)
              : undefined,
            targetEndDate: data.targetEndDate
              ? new Date(data.targetEndDate)
              : undefined,
          }
        : undefined,
    [data]
  );

  const form = useForm<TaskUpdate>({
    resolver: zodResolver(TaskUpdateSchema),
  });

  useEffect(() => {
    if (task) {
      let { id, commentCount, projectTaskId, index, ...rest } = task;
      form.reset({
        ...rest,
      });
    }
  }, [task, form]);

  const [taskCategoryOptions, setTaskCategoryOptions] = useState(
    taskCategoryOptionsRes ?? []
  );
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

  // USE MUTATIONS
  const deleteTask = trpc.tasks.deleteTask.useMutation({
    onSuccess: (data) => {
      console.log("Task deleted:", data);
      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTask = trpc.tasks.updateTask.useMutation({
    onSuccess: () => {
      utils.tasks.getTaskById.invalidate();
      form.reset(form.getValues()); // what does this do
    },
    onError: (err) => {
      // toast
      // rollback (?)
      console.error("Unable to update task", err);
    },
  });

  const getUploadUrls = trpc.tasks.uploadTaskImages.useMutation();

  const updateTaskCategoryOptions =
    trpc.tasks.updateTaskCategoryOptions.useMutation({
      onSuccess: (data) => {
        console.log("Task updated:", data);
        utils.tasks.getTaskById.invalidate({
          taskId: taskId,
          projectId: projectId,
        });
        utils.tasks.getTaskCategoryOptions.invalidate({ projectId });
      },
      onError: (error) => {
        console.error("Failed to create task:", error.message);
      },
    });

  // HANDLE METHODS
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
      response.uploads.map(async ({ url, key }, index) => {
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

  const handleDeleteTask = () => {
    if (task == null) return;

    recentTaskContext?.setTasks([task]); // keep track of this task for insertion later if undone

    deleteTask.mutate({ taskId: task.id });
    navigate(`/projects/${projectId}`);

    actionContext?.setAction("deleted");
  };

  const onSubmit = (data: TaskUpdate) => {
    if (!task || !data) return;

    const updates: Partial<TaskUpdate> = {};

    (Object.keys(data) as (keyof TaskUpdate)[]).forEach((key) => {
      const formValue = data[key];
      const taskValue = task[key];

      // Handle Date comparison specially
      if (formValue instanceof Date && taskValue instanceof Date) {
        if (formValue.getTime() !== taskValue.getTime()) {
          (updates as any)[key] = new Date(formValue);
        }
      } else if (formValue !== taskValue) {
        (updates as any)[key] = formValue;
      }
    });

    if (Object.keys(updates).length === 0) return;

    // task category options update
    if (taskCategoryOptions !== taskCategoryOptionsRes) updateTaskCategoryOptions.mutate({ projectId, taskCategoryOptions });

    updateTask.mutate({ taskId, updates });
  };


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
      navigate(`/workspaces/${workspaceId}/projects/${projectId}`);
    });

    return () => {
      Mousetrap.unbind("ctrl+s");
      Mousetrap.unbind("ctrl+j");
      Mousetrap.unbind("esc");
    };
  }, []);

  if (!task && !taskDataIsLoading) {
    return <Navigate to="/404" replace />;
  }

  if (taskDataIsLoading || task == undefined) {
    console.log("loading");
    return <LoadingModal />;
  }

  return (
    <>
      {!projectNameIsLoading && !workspaceExistsIsLoading && (
        <BreadCrumbs
          crumbs={[
            {
              name: workspaceName as string,
              url: `/workspaces/${workspaceId}`,
            },
            {
              name: projectName as string,
              url: `/workspaces/${workspaceId}/projects/${projectId}`,
            },
            {
              name: task.title,
              url: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`,
            },
          ]}
        />
      )}
      <div className="w-full h-full flex pb-8">
        <div className="scrollbar-group w-[60%] max-h-full overflow-y-scroll super-thin-scrollbar">
          <form
            id="update-task-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="pr-4 flex flex-col gap-y-4"
          >
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <TaskTitle
                  isPage={true}
                  taskTitle={field.value}
                  setTaskTitle={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <TaskDescription
                  isPage={true}
                  taskDescription={field.value}
                  setTaskDescription={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="category"
              render={({ field, fieldState }) => (
                <TaskSelectCategory
                  isPage={true}
                  taskCategoryOptions={taskCategoryOptions}
                  setTaskCategoryOptions={setTaskCategoryOptions}
                  taskCategory={field.value}
                  setTaskCategory={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="priority"
              render={({ field, fieldState }) => (
                <TaskSelectPriority
                  isPage={true}
                  priorityLevels={priorityLevels}
                  taskPriority={field.value}
                  setTaskPriority={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <div className="flex flex-col gap-y-1 w-full">
              <div className="flex w-full gap-x-6">
                <Controller
                  control={form.control}
                  name="targetStartDate"
                  render={({ field, fieldState }) => (
                    <TaskTargetStartDate
                      isPage={true}
                      taskTargetStartDate={field.value}
                      setTaskTargetStartDate={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="targetEndDate"
                  render={({ field, fieldState }) => (
                    <TaskTargetEndDate
                      isPage={true}
                      taskTargetEndDate={field.value}
                      setTaskTargetEndDate={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </div>
            <Controller
              control={form.control}
              name="assignTo"
              render={({ field, fieldState }) => (
                <TaskAssignee
                  isPage={true}
                  projectId={projectId}
                  username={username}
                  taskAssignedTo={field.value ?? []}
                  setTaskAssignedTo={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <>
              <Controller
                control={form.control}
                name="files"
                render={({ field, fieldState }) => (
                  <TaskSelectMedia
                    isPage={true}
                    task={task}
                    projectId={projectId}
                    previewUrls={previewUrls}
                    setPreviewUrls={setPreviewUrls}
                    taskImageUrls={taskImageUrls}
                    setTaskImagesUrls={setTaskImagesUrls}
                    setFiles={setFiles}
                    setImageModalState={setImageModalState}
                    error={fieldState.error?.message}
                  />
                )}
              />
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
            </>
            <Controller
              control={form.control}
              name="link"
              render={({ field, fieldState }) => (
                <TaskLink
                  isPage={true}
                  taskLink={field.value}
                  setTaskLink={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <div className="flex items-center gap-x-4">
              <hr className="flex-grow border-t border-faintWhite" />
              <p className="text-xs text-center text-faintWhite whitespace-nowrap">
                Advanced Task Details
              </p>
              <hr className="flex-grow border-t border-faintWhite" />
            </div>
            <Controller
              control={form.control}
              name="dependsOn"
              render={({ field, fieldState }) => (
                <TaskDependsOn
                  isPage={true}
                  taskId={task.id}
                  projectId={projectId}
                  taskDependsOn={field.value}
                  setTaskDependsOn={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="subtasks"
              render={({ field, fieldState }) => (
                <TaskSubtasks
                  isPage={true}
                  taskSubtasks={field.value ?? []}
                  setTaskSubtasks={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <div className="">
              <h3
                className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
              >
                Personal Notes:
              </h3>
              <textarea
                placeholder="Notes only you can see"
                className={`w-full text-base h-24 placeholder:text-faintWhite shadow-bottom-grey focus:outline-none focus:ring-0 focus:border-transparent`}
                // value=""
                // onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            <div className="flex gap-x-4">
              <button
                type="submit"
                form="update-task-form"
                ref={saveBtnRef}
                className="bg-green-400 w-full flex justify-center items-center text-white text-sm font-semibold py-[0.35rem] rounded-md cursor-pointer disabled:cursor-not-allowed"
                disabled={uploadTaskImagesIsLoading}
              >
                {!uploadTaskImagesIsLoading ? (
                  "Save"
                ) : (
                 <Loader2 className="animate-spin" />
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
                  <Loader2 className="animate-spin" />
                )}
              </button>
            </div>
          </form>
        </div>
        <div className="w-[40%] pl-4 pr-2 py-1 max-h-full overflow-y-scroll super-thin-scrollbar">
          <TaskDiscussionBoard
            ref={joinDiscussionRef}
            isPage={true}
            user={username}
            taskId={task.id}
          />
        </div>
      </div>
    </>
  );
};

export default TaskPage;
