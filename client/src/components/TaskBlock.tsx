import React, { useState } from "react";
import { ColumnKey, Task } from "../../../server/src/shared/types";
import TaskPriority from "./TaskPriority";
import TaskModal from "./TaskModal";
import TaskMediaCount from "./TaskMedia";
import TaskCommentCount from "./TaskCommentCount";
import TaskCategory from "./TaskCategory";

const TaskBlock = ({
  col,
  task,
  projectId,
  handleDragStart,
  setUsernameModal,
  username
}: {
  col: ColumnKey;
  task: Task;
  projectId: string,
  handleDragStart: (fromColumn: ColumnKey, task: Task) => void;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>
  username: string|undefined
}) => {
  const [taskDetailsModal, setTaskDetailsModal] = useState(false);

  const categories = ['feature', 'bug', 'refactor', '']

  const category = categories[Math.floor(Math.random() * categories.length)];

  return (
    <>
      {taskDetailsModal && <TaskModal username={username} setUsernameModal={setUsernameModal} task={task} projectId={projectId} setTaskDetailsModal={setTaskDetailsModal} />}
      <div
        tabIndex={0}
        role="button"
        draggable
        onDragStart={() => handleDragStart(col, task)}
        onClick={() => setTaskDetailsModal(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setTaskDetailsModal(true)
            e.currentTarget.blur(); 
          }
        }}
        className={`relative border focus:ring-0 focus:outline-none dark:focus:border-midWhite px-3 pt-3 pb-2 mb-2 dark:bg-backgroundDark bg-lmLightBackground rounded-md dark:border-faintWhite cursor-move border-faintBlack/15 shadow-bottom-grey`}
      >
        <h1 className="text-xs line-clamp-2 font-jetbrains" title={task.title}><span className="font-semibold text-midWhite">[{task.projectTaskId}]</span> {task.title}</h1>
        <div className="mt-4">
          <div className="flex gap-x-2 items-center">
            <TaskPriority priority={task.priority} />
            <TaskCategory category={category} />
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
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskBlock;
