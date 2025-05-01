import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TaskBLock from "../components/TaskBlock";
import AddTask from "../components/AddTask";
import { trpc } from "../utils/trpc";

// TASKS
export type Task = {
  id: string,
  title: string,
  description: string,
  priority: 'high' | 'low' | 'medium',
  assignedTo: string,
  progress: string,
  projectTaskId: number
}

// COLUMNS
export type ColumnKey = "backlog" | "in progress" | "for checking" | "done";

type Columns = {
  [key in ColumnKey]: Task[];
};

const initialColumns: Columns = {
  backlog: [],
  "in progress": [],
  "for checking": [],
  "done": []
};

const groupTasksByColumn = (taskList: Task[]) => {
  const grouped: Columns = {
    backlog: [],
    'in progress': [],
    'for checking': [],
    done: [],
  };

  taskList.forEach((t) => {
    const key = t.progress as ColumnKey;
    grouped[key].push(t);
  });

  return grouped;
};


const Project = () => {
  const { projectId } = useParams();

  const { data, isLoading } = trpc.getTasks.useQuery({ id: projectId ?? '' });
  
  const [columns, setColumns] = useState(initialColumns);
  const [dragData, setDragData] = useState<{ from: ColumnKey; task: Task } | null>(null);
  
  useEffect(() => {
    if (data) {
      setColumns(groupTasksByColumn(data));
    }
  }, [data]);
  
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
          className="flex-1 p-4 bg-[#282828] rounded-md group"
        >
          <h2 className="font-semibold text-sm capitalize py-2 text-center font-noto">{col}</h2>
          {columns[col].map((task) => (
            <React.Fragment key={task.id}>
              <TaskBLock col={col} task={task} handleDragStart={handleDragStart} />
            </React.Fragment>
          ))}
          <AddTask col={col} className="hidden group-hover:block" />
        </div>
      ))}
    </div>
  );
};

export default Project;
