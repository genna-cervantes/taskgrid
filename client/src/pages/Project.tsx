import React, { useState } from "react";
import { useParams } from "react-router-dom";

// COLUMNS
type ColumnKey = "backlog" | "in progress" | "for checking" | "done";

type Columns = {
  [key in ColumnKey]: string[];
};

const initialColumns: Columns = {
  backlog: ["Task A", "Task B"],
  "in progress": [],
  "for checking": [],
  "done": []
};



const Project = () => {
  const { projectId } = useParams();

  const [columns, setColumns] = useState(initialColumns);
  const [dragData, setDragData] = useState<{ from: ColumnKey; item: string } | null>(null);

  const handleDragStart = (fromColumn: ColumnKey, item: string) => {
    setDragData({ from: fromColumn, item });
  };

  const handleDrop = (toColumn: ColumnKey) => {
    if (!dragData) return;
    const { from, item } = dragData;

    setColumns((prev: Columns) => {
      const newFrom = prev[from].filter((i: string) => i !== item);
      const newTo = [...prev[toColumn], item];
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
          {columns[col].map((item) => (
            <div
              key={item}
              draggable
              onDragStart={() => handleDragStart(col, item)}
              className="p-2 mb-2 bg-[#464646] rounded cursor-move"
            >
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Project;
