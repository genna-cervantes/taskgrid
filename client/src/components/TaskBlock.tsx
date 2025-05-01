import React from "react";
import { ColumnKey, Task } from "../pages/Project";
import TaskPriority from "./TaskPriority";

const TaskBlock = ({ col, task, handleDragStart }: { col: ColumnKey, task: Task, handleDragStart: (fromColumn: ColumnKey, task: Task) => void }) => {
  return (
    <div
      key={task.id}
      draggable
      onDragStart={() => handleDragStart(col, task)}
      className="px-4 py-3 mb-2 bg-[#464646] rounded-md cursor-move"
    >
      <h1 className="text-sm">{task.title}</h1>
      <div className="mt-4">
        <TaskPriority priority={task.priority} />
        <div className="flex justify-between text-xs pt-1">
          <p className="font-semibold">[{task.id}]</p>
          <p>{task.assignedTo}</p>
        </div>
      </div>
    </div>
  );
};

export default TaskBlock;
