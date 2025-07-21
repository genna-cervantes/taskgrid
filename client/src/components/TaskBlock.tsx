import React, { useRef, useState } from "react";
import { ColumnKey, Task } from "../../../server/src/shared/types";
import TaskPriority from "./TaskPriority";
import TaskModal from "./TaskModal";
import TaskMediaCount from "./TaskMedia";
import TaskCommentCount from "./TaskCommentCount";
import TaskCategory from "./TaskCategory";
import { Checkbox } from "./ui/checkbox";
import { trpc } from "@/utils/trpc";
import { useDrag, useDrop } from "react-dnd";

export const ItemTypes = {
  CARD: 'CARD',
};

interface DragItem {
  id: string;
  fromColumn: ColumnKey;
  index: number;
}

const TaskBlock = ({
  col,
  task,
  projectId,
  showDependencies,
  showAllSubtasks,
  taskCategoryOptions,
  setUsernameModal,
  username,
  moveCard,
  moveAcrossColumnPreview,
  persistTaskMove
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
  moveCard: (fromIndex: number, toIndex: number) => void
  moveAcrossColumnPreview: (taskId: string, fromColumn: ColumnKey, toColumn: ColumnKey, toIndex: number) => void;
  persistTaskMove: (taskId: string, fromColumn: ColumnKey, toColumn: ColumnKey, toIndex: number) => Promise<void>
}) => {
  const ref = useRef<HTMLDivElement>(null);
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

  // drag and drop implementation
  const [, drop] = useDrop<DragItem>({
    accept: ItemTypes.CARD,
    hover(draggedItem: DragItem){
      if (!ref.current) return;
      if (!draggedItem || !draggedItem.id) return; 
      if (draggedItem.id === task.id) return;

      const isSameColumn = draggedItem.fromColumn === col;

      if (isSameColumn){
        moveCard(draggedItem.index, task.index);
        draggedItem.index = task.index
      }else{
        moveAcrossColumnPreview(
          draggedItem.id,
          draggedItem.fromColumn,
          col,
          task.index
        )
        draggedItem.fromColumn = col;
        draggedItem.index = task.index;
      }
    },
    drop(draggedItem){
      if (!draggedItem || !draggedItem.id) return;
      persistTaskMove(draggedItem.id, draggedItem.fromColumn, col, task.index);
    }
  })

  const [{isDragging}, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => ({
      id: task.id,
      fromColumn: col,
      index: task.index
    }),
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  })

  drag(drop(ref));

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
      <div
        ref={ref}
        tabIndex={0}
        role="button"
        onClick={() => setTaskDetailsModal(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setTaskDetailsModal(true);
            e.currentTarget.blur();
          }
        }}
        className={`relative ${showDependencies ? "hover:cursor-pointer" : "hover:cursor-grab"} border focus:ring-0 focus:outline-none dark:focus:border-midWhite px-3 pt-3 pb-2 dark:bg-backgroundDark bg-lmLightBackground rounded-md dark:border-faintWhite cursor-move border-faintBlack/15 shadow-bottom-grey`}
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

export default TaskBlock;
