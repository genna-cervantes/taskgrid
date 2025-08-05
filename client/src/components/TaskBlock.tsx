import React, { useState } from "react";
import { ColumnKey, Task } from "../../../server/src/shared/types";
import TaskPriority from "./TaskPriority";
import TaskMediaCount from "./TaskMedia";
import TaskCommentCount from "./TaskCommentCount";
import TaskCategory from "./TaskCategory";
import { Checkbox } from "./ui/checkbox";
import { trpc } from "@/utils/trpc";
import { useNavigate } from "react-router-dom";

const TaskBlock = ({
  col,
  task,
  projectId,
  showAllSubtasks,
  taskCategoryOptions,
  username,
  handleDragStart
}: {
  col: ColumnKey;
  task: Task;
  projectId: string;
  showAllSubtasks: boolean;
  taskCategoryOptions:
    | {
        category: string;
        color: string;
      }[]
    | undefined;
  username: string | undefined;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string, progress: string) => void
}) => {
  const utils = trpc.useUtils();
  const navigate = useNavigate()

  const [showSubtasks, setShowsubtasks] = useState(false);

  const updateTaskSubtasks = trpc.tasks.updateTaskSubtasks.useMutation({
    onSuccess: (updatedTask) => {
      utils.tasks.getTasks.setData(
        {id: projectId},
        (oldData) => {
          if (!oldData) return oldData;

          const updated = oldData.map((t) => {
            if (t.id === updatedTask.id.toString()){
              return {...t, subtasks: updatedTask.subtasks}
            }else{
              return t;
            }
          })

          return updated;
        }
      );
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
    const updated = [...task.subtasks];
    updated[index] = { ...updated[index], isDone: !updated[index].isDone };

    updateTaskSubtasks.mutate({
      projectId,
      taskId: task.id,
      subtasks: [...updated, {title: "", isDone: false}],
    });
  };


  return (
    <>
      <DropIndicator beforeId={task.id} column={col} />
      <div
        tabIndex={0}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, task.id, task.progress)}
        onClick={() => navigate(`tasks/${task.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            navigate(`tasks/${task.id}`)
          }
        }}
        className={`relative hover:cursor-grab active:cursor-grabbing focus:cursor-grabbing border focus:ring-0 focus:outline-none dark:focus:border-midWhite px-3 pt-3 pb-2 dark:bg-[#1A1A1A] bg-lmLightBackground rounded-md dark:border-faintWhite cursor-move border-faintBlack/15 shadow-bottom-grey`}
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
            {(task.files?.length ?? 0) > 1 && (
              <TaskMediaCount mediaCount={task.files?.length ?? 0} />
            )}
            {task.commentCount > 0 && (
              <TaskCommentCount commentCount={task.commentCount} />
            )}
          </div>
          <div className="flex justify-between text-xxs mt-2">
            <div title={task.assignTo.join(" ")}>
              {(() => {
                const formatted = task.assignTo
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
            {task.subtasks && task.subtasks.length > 0 && (
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
          {(showSubtasks || showAllSubtasks) && task.subtasks && task.subtasks.length > 0 &&  (
            <div className="mt-5 mb-1">
              <div className="h-[1px] w-full bg-faintWhite mt-4 mb-2"></div>
              <div className="flex flex-col gap-y-2">
                {task.subtasks.map((s, index) => (
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
