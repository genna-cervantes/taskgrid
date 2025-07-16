import React, { useState } from "react";
import { ColumnKey, Task } from "../../../server/src/shared/types";
import TaskPriority from "./TaskPriority";
import TaskModal from "./TaskModal";
import TaskMediaCount from "./TaskMedia";
import TaskCommentCount from "./TaskCommentCount";
import TaskCategory from "./TaskCategory";
import { Checkbox } from "./ui/checkbox";

const TaskBlock = ({
  col,
  task,
  projectId,
  showDependencies,
  taskCategoryOptions,
  handleDragStart,
  setUsernameModal,
  username
}: {
  col: ColumnKey;
  task: Task;
  projectId: string,
  showDependencies: boolean;
  taskCategoryOptions: {
    category: string;
    color: string;
}[] | undefined;
  handleDragStart: (fromColumn: ColumnKey, task: Task) => void;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>
  username: string|undefined
}) => {
  const [taskDetailsModal, setTaskDetailsModal] = useState(false);
  const [showSubtasks, setShowsubtasks] = useState(false);

  const handleSubtaskChange = (e: React.FormEvent<HTMLButtonElement>) => {
    e.stopPropagation()
  }

  return (
    <>
      {taskDetailsModal && <TaskModal taskCategoryOptionsProp={taskCategoryOptions} username={username} setUsernameModal={setUsernameModal} task={task} projectId={projectId} setTaskDetailsModal={setTaskDetailsModal} />}
      <div
        tabIndex={0}
        role="button"
        draggable={!showDependencies}
        onDragStart={() => handleDragStart(col, task)}
        onClick={() => setTaskDetailsModal(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setTaskDetailsModal(true)
            e.currentTarget.blur(); 
          }
        }}
        className={`relative ${showDependencies ? "hover:cursor-pointer" : "hover:cursor-grab"} border focus:ring-0 focus:outline-none dark:focus:border-midWhite px-3 pt-3 pb-2 dark:bg-backgroundDark bg-lmLightBackground rounded-md dark:border-faintWhite cursor-move border-faintBlack/15 shadow-bottom-grey`}
      >
        <h1 className="text-xs line-clamp-2 font-jetbrains" title={task.title}><span className="font-semibold text-midWhite">[{task.projectTaskId}]</span> {task.title}</h1>
        <div className="mt-4">
          <div className="flex gap-x-2 items-center">
            <TaskPriority priority={task.priority} />
            {task.category && <TaskCategory category={task.category} taskCategoryOptions={taskCategoryOptions} />}
            {task.files.length > 1 && <TaskMediaCount mediaCount={task.files.length} />}
            {task.commentCount > 0 && <TaskCommentCount commentCount={task.commentCount} />}
          </div>
          <div className="flex justify-between text-xxs mt-2">
            <div title={task.assignedTo.join(" ")}>
              {(() => {
                const formatted = task.assignedTo
                  .map((at) => `${at}${at === username ? ' (You)' : ''}`)
                  .join(', ');

                const maxLen = 30;
                const display = formatted.length > maxLen
                  ? formatted.slice(0, maxLen).trimEnd() + '...'
                  : formatted;

                return display;
              })()}
            </div>
            {task.subtasks && <div className="cursor-pointer" onClick={(e) => {
              e.stopPropagation()
              setShowsubtasks(!showSubtasks)}
            }>
              <p>{task.subtasks.filter((s) => s.isDone).length}/{task.subtasks.length}</p>
            </div>}
          </div>
            {showSubtasks && <div className="mt-5 mb-1">
              <div className="h-[1px] w-full bg-faintWhite mt-4 mb-2"></div>
              <div className="flex flex-col gap-y-2">
                {task.subtasks.map((s) => (
                  <span className="flex gap-x-2 w-full items-center text-xs">
                    <Checkbox onChange={(e) => handleSubtaskChange(e)} onClick={(e) => e.stopPropagation()} value={s.isDone ? 1 : 0} />
                    <p>{s.title}</p>
                  </span>
                ))}
              </div>
            </div>}
        </div>
      </div>
    </>
  );
};

export default TaskBlock;
