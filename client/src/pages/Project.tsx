import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import TaskBLock from "../components/TaskBlock";
import AddTask from "../components/AddTask";
import { trpc } from "../utils/trpc";
import { addProjectId } from "../utils/indexedb";
import { Columns, Task, ColumnKey } from "../../../server/src/shared/types";

const Project = () => {
  const { projectId } = useParams();

  const { setUsernameModal, userName, columns } = useOutletContext<{
    setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
    userName: string | undefined;
    columns: Columns
  }>();

  const utils = trpc.useUtils();
  
  const [dragData, setDragData] = useState<{
    from: ColumnKey;
    task: Task;
  } | null>(null);


  const updateTaskProgress = trpc.updateTaskProgress.useMutation({
    onSuccess: (data) => {
      console.log("Task updated:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const handleDragStart = (fromColumn: ColumnKey, task: Task) => {
    setDragData({ from: fromColumn, task });
  };

  const handleDrop = (toColumn: ColumnKey) => {
    if (!dragData) return;
    const { task } = dragData;

    // update in database
    updateTaskProgress.mutate({ progress: toColumn, taskId: task.id });
  };

  // should redirect to not found
  if (!projectId) {
    return <div>missing project id</div>;
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4 px-4 pb-4 flex-1 overflow-auto">
        {(Object.keys(columns) as ColumnKey[]).map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col)}
            className="flex-1 p-4 bg-[#282828] rounded-md group"
          >
            <h2 className="font-semibold text-sm capitalize py-2 text-center font-noto">
              {col} ({columns[col].length})
            </h2>
            <div className="max-w-full overflow-y-auto space-y-2 my-2 max-h-[calc(100vh-200px)] scrollbar-none">
              {columns[col].map((task) => (
                <React.Fragment key={task.id}>
                  <TaskBLock
                    projectId={projectId}
                    col={col}
                    task={task}
                    handleDragStart={handleDragStart}
                    setUsernameModal={setUsernameModal}
                    username={userName}
                  />
                </React.Fragment>
              ))}
            </div>
            <AddTask
              projectId={projectId}
              col={col}
              className="hidden group-hover:block"
              username={userName}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default Project;
