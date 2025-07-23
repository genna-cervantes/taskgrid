import React, { useRef, useState } from "react";
import { ColumnKey, Task } from "../../../server/src/shared/types";
import TaskPriority from "./TaskPriority";
import TaskModal from "./TaskModal";
import TaskMediaCount from "./TaskMedia";
import TaskCommentCount from "./TaskCommentCount";
import TaskCategory from "./TaskCategory";
import { Checkbox } from "./ui/checkbox";
import { trpc } from "@/utils/trpc";

const TaskBlock = ({
  col,
  task,
  projectId,
  showDependencies,
  showAllSubtasks,
  taskCategoryOptions,
  setUsernameModal,
  username,
  handleDragStart
}: {
  col: ColumnKey;
  task: Task;
  projectId: string;
  showDependencies: boolean;
  showAllSubtasks: boolean;
  taskCategoryOptions:
    | {
        category: string;
        color: string;
      }[]
    | undefined;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
  username: string | undefined;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string, progress: string) => void
}) => {
  const utils = trpc.useUtils();

  const [taskDetailsModal, setTaskDetailsModal] = useState(false);
  const [showSubtasks, setShowsubtasks] = useState(false);

  const [subtasks, setSubtasks] = useState(task.subtasks);

  const updateTaskSubtasks = trpc.updateTaskSubtasks.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTaskById.invalidate({ taskId: task.id, projectId: projectId });
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const handleSubtaskChange = (
    e: React.FormEvent<HTMLButtonElement>,
    index: number
  ) => {
    e.stopPropagation();

    setSubtasks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isDone: !updated[index].isDone };

      updateTaskSubtasks.mutate({
        projectId,
        taskId: task.id,
        subtasks: [...updated, {title: "", isDone: false}],
      });

      return updated;
    });
  };


  return (
    <>
      {taskDetailsModal && (
        <TaskModal
          taskCategoryOptionsProp={taskCategoryOptions}
          username={username}
          setUsernameModal={setUsernameModal}
          task={task}
          projectId={projectId}
          setTaskDetailsModal={setTaskDetailsModal}
        />
      )}
      <DropIndicator beforeId={task.id} column={col} />
      <div
        tabIndex={0}
        role="button"
        draggable={true}
        onDragStart={(e) => handleDragStart(e, task.id, task.progress)}
        onClick={() => setTaskDetailsModal(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setTaskDetailsModal(true);
            e.currentTarget.blur();
          }
        }}
        className={`relative hover:cursor-grab active:cursor-grabbing focus:cursor-grabbing border focus:ring-0 focus:outline-none dark:focus:border-midWhite px-3 pt-3 pb-2 dark:bg-backgroundDark bg-lmLightBackground rounded-md dark:border-faintWhite cursor-move border-faintBlack/15 shadow-bottom-grey`}
      >
        <h1 className="text-xs line-clamp-2 font-jetbrains" title={task.title}>
          <span className="font-semibold text-midWhite">
            [{task.projectTaskId}]
          </span>{" "}
          {task.title}
        </h1>
        <div className="mt-4">
          <div className="flex gap-x-2 items-center">
            <TaskPriority priority={task.priority} />
            {task.category && (
              <TaskCategory
                category={task.category}
                taskCategoryOptions={taskCategoryOptions}
              />
            )}
            {task.files.length > 1 && (
              <TaskMediaCount mediaCount={task.files.length} />
            )}
            {task.commentCount > 0 && (
              <TaskCommentCount commentCount={task.commentCount} />
            )}
          </div>
          <div className="flex justify-between text-xxs mt-2">
            <div title={task.assignedTo.join(" ")}>
              {(() => {
                const formatted = task.assignedTo
                  .map((at) => `${at}${at === username ? " (You)" : ""}`)
                  .join(", ");

                const maxLen = 30;
                const display =
                  formatted.length > maxLen
                    ? formatted.slice(0, maxLen).trimEnd() + "..."
                    : formatted;

                return display;
              })()}
            </div>
            {task.subtasks && (
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowsubtasks(!showSubtasks);
                }}
              >
                <p>
                  {task.subtasks.filter((s) => s.isDone).length}/
                  {task.subtasks.length}
                </p>
              </div>
            )}
          </div>
          {(showSubtasks || showAllSubtasks) && subtasks &&  (
            <div className="mt-5 mb-1">
              <div className="h-[1px] w-full bg-faintWhite mt-4 mb-2"></div>
              <div className="flex flex-col gap-y-2">
                {subtasks.map((s, index) => (
                  <span className="flex gap-x-2 w-full items-center text-xs">
                    <Checkbox
                      onClick={(e) => handleSubtaskChange(e, index)}
                      checked={s.isDone}
                      value={s.isDone ? 1 : 0}
                    />
                    <p>{s.title}</p>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const DropIndicator = ({beforeId, column}: {beforeId: string, column: ColumnKey}) => {
  return <div
  data-before={beforeId}
  data-column={column}
   className="h-[2px] w-full bg-purple-200/50 my-1 opacity-0"></div>
}

export default TaskBlock;
