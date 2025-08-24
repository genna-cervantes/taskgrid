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
  daysInColumn: z.number()
}) satisfies z.ZodType<Task>;

const TaskUpdateSchema = z
  .object({})
  .merge(TaskSchema.omit({ id: true }).partial());

type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

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
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    );

  const { data: usersInProject } = trpc.users.getUsernamesInProject.useQuery({
    id: projectId,
  });

  const {
    data: taskCategoryOptionsRes,
    isLoading: taskCategoryOptionsIsLoading,
  } = trpc.tasks.getTaskCategoryOptions.useQuery({ projectId });

  useEffect(() => {
    if (taskCategoryOptionsRes && !taskCategoryOptionsIsLoading) {
      setTaskCategoryOptions(taskCategoryOptionsRes);
    }
  }, [taskCategoryOptionsRes]);

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
      utils.tasks.getTaskCategoryOptions.invalidate();
      form.reset(form.getValues()); // what does this do
    },
    onError: (err) => {
      // toast
      // rollback (?)
      console.error("Unable to update task", err);
    },
  });

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

  const handleDeleteTask = () => {
    if (task == null) return;

    // recentTaskContext?.setTasks([task]); // keep track of this task for insertion later if undone

    deleteTask.mutate({ taskId: task.id });
    navigate(`/workspaces/${workspaceId}/projects/${projectId}`);

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
    if (taskCategoryOptions !== taskCategoryOptionsRes)
      updateTaskCategoryOptions.mutate({ projectId, taskCategoryOptions });

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
        <div className="scrollbar-group w-[60%] h-full overflow-y-auto super-thin-scrollbar">
          <form
            id="update-task-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="pr-4 flex flex-col min-h-full justify-between gap-y-4"
          >
            <div className="flex flex-col gap-y-4 overflow-hidden">
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
              <div className="overflow-hidden h-96">
                <div className="flex justify-between w-full mb-2">
                  <h3
                    className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
                  >
                    Discussion:
                  </h3>
                </div>
                <div className="max-h-full overflow-auto overscroll-contain super-thin-scrollbar">
                  <TaskDiscussionBoard
                    ref={joinDiscussionRef}
                    isPage={true}
                    user={userContext.username ?? undefined}
                    taskId={task.id}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-x-4">
              <button
                type="submit"
                form="update-task-form"
                ref={saveBtnRef}
                className="bg-green-400 w-full flex justify-center items-center text-white text-sm font-semibold py-[0.35rem] rounded-md cursor-pointer disabled:cursor-not-allowed"
                disabled={updateTask.isLoading}
              >
                {updateTask.isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
              </button>

              <button
                onClick={handleDeleteTask}
                className="bg-red-400 w-full text-white text-sm py-[0.35rem] flex justify-center font-semibold rounded-md cursor-pointer disabled:cursor-not-allowed"
                disabled={deleteTask.isLoading || updateTask.isLoading}
              >
                {deleteTask.isLoading || updateTask.isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </form>
        </div>
        {/* <div className="w-[40%] pl-4 pr-2 py-1 max-h-full overflow-y-scroll super-thin-scrollbar">
          <TaskDiscussionBoard
            ref={joinDiscussionRef}
            isPage={true}
            user={userContext.username ?? undefined}
            taskId={task.id}
          />
        </div> */}

        <div className="w-[40%] pl-4 pr-2 py-1 flex flex-col gap-y-4">
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
          <Controller
            control={form.control}
            name="category"
            render={({ field, fieldState }) => (
              <TaskSelectCategory
                isPage={true}
                taskCategoryOptions={taskCategoryOptions}
                taskCategoryOptionsIsLoading={taskCategoryOptionsIsLoading}
                setTaskCategoryOptions={setTaskCategoryOptions}
                taskCategory={field.value}
                setTaskCategory={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="assignTo"
            render={({ field, fieldState }) => (
              <TaskAssignee
                isPage={true}
                projectId={projectId}
                usersInProj={usersInProject ?? []}
                username={userContext.username ?? undefined}
                taskAssignedTo={field.value ?? []}
                setTaskAssignedTo={field.onChange}
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
        </div>
      </div>
    </>
  );
};

export default TaskPage;
