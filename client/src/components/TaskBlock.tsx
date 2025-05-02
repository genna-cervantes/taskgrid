import React, { useEffect, useState } from "react";
import { ColumnKey, Task } from "../pages/Project";
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
        className="px-4 py-3 mb-2 bg-[#464646] rounded-md cursor-move"
      >
        <h1 className="text-sm truncate">{task.title}</h1>
        <div className="mt-4">
          <TaskPriority priority={task.priority} />
          <div className="flex justify-between text-xs pt-1">
            <p className="font-semibold">[{task.projectTaskId}]</p>
            <p>{task.assignedTo} {task.assignedTo === username ? '(You)' : ''}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskBlock;
