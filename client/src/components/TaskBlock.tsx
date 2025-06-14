import React, { useState } from "react";
import { ColumnKey, Task } from "../../../server/src/shared/types";
import TaskPriority from "./TaskPriority";
import TaskModal from "./TaskModal";

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

  return (
    <>
      {taskDetailsModal && <TaskModal username={username} setUsernameModal={setUsernameModal} task={task} projectId={projectId} setTaskDetailsModal={setTaskDetailsModal} />}
      <div
        key={task.id}
        draggable
        onDragStart={() => handleDragStart(col, task)}
        onClick={() => setTaskDetailsModal(true)}
        className="px-3 py-3 mb-2 dark:bg-light bg-lmLightBackground rounded-md cursor-move border-[1px] border-faintBlack/5 shadow-sm"
      >
        <h1 className="text-sm line-clamp-2" title={task.title}>{task.title}</h1>
        <div className="mt-2">
          <TaskPriority priority={task.priority} />
          <div className="flex justify-between text-xs">
            <p className="font-semibold">[{task.projectTaskId}]</p>
            <div className="text-xs" title={task.assignedTo.join(" ")}>
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
