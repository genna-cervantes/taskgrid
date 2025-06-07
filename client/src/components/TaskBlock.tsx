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
        className="px-3 py-3 mb-2 bg-[#464646] rounded-md cursor-move border-2 border-gray-600/30 shadow-sm"
      >
        <h1 className="text-sm line-clamp-2" title={task.title}>{task.title}</h1>
        <div className="mt-2">
          <TaskPriority priority={task.priority} />
          <div className="flex justify-between text-xs">
            <p className="font-semibold">[{task.projectTaskId}]</p>
            <p>{task.assignedTo} {task.assignedTo === username ? '(You)' : ''}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskBlock;
