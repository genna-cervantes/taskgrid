import React, { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import TaskBLock from "../components/TaskBlock";
import AddTask from "../components/AddTask";
import { trpc } from "../utils/trpc";
import { Columns, Task, ColumnKey } from "../../../server/src/shared/types";
import ClearTask from "../components/ClearTask";
import { Ellipsis } from "lucide-react";

const Project = () => {
  const { projectId } = useParams();
  const utils = trpc.useUtils();

  const { setUsernameModal, username, columns } = useOutletContext<{
    setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
    username: string | undefined;
    columns: Columns;
  }>();

  if (!columns) {
    return (
      <p className="text-sm opacity-50 text-center mt-8">
        Loading your taskan boards...
      </p>
    );
  }

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

  // helper functions
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-4 flex-1 overflow-auto lg:overflow-y-hidden ">
        {(Object.keys(columns) as ColumnKey[]).map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col)}
            className="flex-1 px-4 py-3 dark:bg-backgroundDark bg-lmMidBackground rounded-md border-[1px] dark:border-faintWhite/5 border-faintBlack/5 group"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-x-2">
                <h2 className="font-semibold text-sm capitalize py-1 text-center font-noto">
                  {col}
                </h2>
                <div className="px-2 flex justify-center items-center font-semibold text-xs capitalize py-1 text-center font-noto rounded-full bg-gray-500/20">
                  {columns[col].length}
                </div>
              </div>
              <div className="flex items-center gap-x-1">
                <Ellipsis className="text-faintWhite h-4 hover:text-fadedWhite hover:cursor-pointer" />
                <AddTask
                  type=""
                  projectId={projectId}
                  col={col}
                  className="hidden group-hover:block"
                  username={username}
                />
                {/* <ClearTask
                  tasks={columns[col] as Task[]}
                  projectId={projectId}
                  col={col}
                  className="hidden group-hover:block"
                /> */}
              </div>
            </div>

            <div className="max-w-full overflow-y-auto space-y-2 my-2 max-h-[calc(100vh-200px)] scrollbar-none">
              {columns[col].map((task) => {
                console.log(task);
                return (
                  <React.Fragment key={task.id}>
                    <TaskBLock
                      projectId={projectId}
                      col={col}
                      task={task}
                      handleDragStart={handleDragStart}
                      setUsernameModal={setUsernameModal}
                      username={username}
                    />
                  </React.Fragment>
                );
              })}
            </div>
            <AddTask
              type="block"
              projectId={projectId}
              col={col}
              className="hidden group-hover:block"
              username={username}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default Project;
