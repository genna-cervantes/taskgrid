import React, { useState } from "react";
import { ColumnKey, Task } from "../../../server/src/shared/types";
import TaskPriority from "./TaskPriority";
import TaskModal from "./TaskModal";
import TaskMediaCount from "./TaskMedia";
import TaskCommentCount from "./TaskCommentCount";

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

  const commentCount = Math.floor(Math.random() * 15)

  return (
    <>
      {taskDetailsModal && <TaskModal username={username} setUsernameModal={setUsernameModal} task={task} projectId={projectId} setTaskDetailsModal={setTaskDetailsModal} />}
      <div
        key={task.id}
        draggable
        onDragStart={() => handleDragStart(col, task)}
        onClick={() => setTaskDetailsModal(true)}
        className="px-3 py-3 mb-2 dark:bg-light bg-lmLightBackground rounded-md border-[1px] dark:border-faintWhite/5 cursor-move border-faintBlack/15 shadow-sm"
      >
        <h1 className="text-xs line-clamp-2 font-jetbrains" title={task.title}><span className="font-semibold text-midWhite">[{task.projectTaskId}]</span> {task.title}</h1>
        <div className="mt-4">
          <div className="flex gap-x-1">
            <TaskPriority priority={task.priority} />
            {task.files.length > 1 && <TaskMediaCount mediaCount={task.files.length} />}
            {commentCount > 5 && <TaskCommentCount commentCount={commentCount} />}
          </div>
          <div className="flex justify-between text-xs mt-1">
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
