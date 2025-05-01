import React, { useState } from "react";
import { useParams } from "react-router-dom";
import TaskBLock from "../components/TaskBlock";

// TASKS
export type Task = {
  id: string,
  title: string,
  description: string,
  priority: 'high' | 'low' | 'medium',
  assignedTo: string
}

const initialTask: Task[] = [{
  id: 'T1',
  title: 'New Task',
  description: 'Description of task...',
  priority: 'high',
  assignedTo: ''
}, {
  id: 'T2',
  title: 'New Task 2',
  description: 'Description of task...',
  priority: 'medium',
  assignedTo: 'Genna Cervantes'
}, {
  id: 'T3',
  title: 'New Task 3',
  description: 'Description of task...',
  priority: 'low',
  assignedTo: ''
}]

// COLUMNS
export type ColumnKey = "backlog" | "in progress" | "for checking" | "done";

type Columns = {
  [key in ColumnKey]: Task[];
};

const initialColumns: Columns = {
  backlog: [initialTask[0], initialTask[2]],
  "in progress": [initialTask[1]],
  "for checking": [],
  "done": []
};

const Project = () => {
  const { projectId } = useParams();

  const [columns, setColumns] = useState(initialColumns);
  const [dragData, setDragData] = useState<{ from: ColumnKey; task: Task } | null>(null);

  const handleDragStart = (fromColumn: ColumnKey, task: Task) => {
    setDragData({ from: fromColumn, task });
  };

  const handleDrop = (toColumn: ColumnKey) => {
    if (!dragData) return;
    const { from, task } = dragData;

    setColumns((prev: Columns) => {
      const newFrom = prev[from].filter((i: Task) => i.id !== task.id);
      const newTo = [...prev[toColumn], task];
      return { ...prev, [from]: newFrom, [toColumn]: newTo };
    });
  };

  return (
    <div className="flex gap-4 p-4 flex-1 overflow-auto">
      {(Object.keys(columns) as ColumnKey[]).map((col) => (
        <div
          key={col}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col)}
          className="flex-1 p-4 bg-[#282828] rounded-md"
        >
          <h2 className="font-semibold text-sm capitalize py-2 text-center font-noto">{col}</h2>
          {columns[col].map((task) => (
              <TaskBLock col={col} task={task} handleDragStart={handleDragStart} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Project;
