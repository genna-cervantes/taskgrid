import React, { useEffect, useState } from "react";
import { Outlet, useMatch, useOutletContext, useParams } from "react-router-dom";
import TaskBLock from "../components/TaskBlock";
import AddTask from "../components/AddTask";
import { trpc } from "../utils/trpc";
import { Columns, Task, ColumnKey } from "../../../server/src/shared/types";
import ClearTask from "../components/ClearTask";
import { Ellipsis } from "lucide-react";
import Mousetrap from "mousetrap";
import Xarrow from "react-xarrows";


const Project = () => {
  const { projectId } = useParams();
  const isTaskRoute = useMatch("/projects/:projectId/tasks/*");
  const utils = trpc.useUtils();

  const [addModal, setAddModal] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  const [showAllSubtasks, setShowAllSubtasks] = useState(false);

  const { setUsernameModal, username, columns, taskCategoryOptions } = useOutletContext<{
    setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
    username: string | undefined;
    columns: Columns;
    taskCategoryOptions: {category: string, color: string}[]|undefined
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

  // keyboard shortcuts
  useEffect(() => {
    Mousetrap.bind('ctrl+alt+n', function(e) {
      e.preventDefault();
      setAddModal(true);
    });

    Mousetrap.bind('ctrl+alt+d', function(e) {
      e.preventDefault();
      setShowDependencies((prev) => !prev)
    });

    Mousetrap.bind('ctrl+alt+s', function(e) {
      e.preventDefault();
      setShowAllSubtasks((prev) => !prev)
    });
    
    return () => {
      Mousetrap.unbind('ctrl+alt+n');
      Mousetrap.unbind('ctrl+alt+d');
      Mousetrap.unbind('ctrl+alt+s');
    };
  }, []);
  

  // should redirect to not found
  if (!projectId) {
    return <div>missing project id</div>;
  }

  if (isTaskRoute){
    return <Outlet />
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-4 flex-1 overflow-auto lg:overflow-y-hidden ">
        {(Object.keys(columns) as ColumnKey[]).map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col)}
            className="flex-1 px-3 py-3 dark:bg-backgroundDark bg-lmMidBackground rounded-md border-[1px] dark:border-faintWhite/5 border-faintBlack/5 group/column"
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
                  addModal={addModal}
                  setAddModal={setAddModal}
                  projectId={projectId}
                  col={col}
                  className="hidden group-hover/column:block"
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

            {/* gap-y-3 if open ung dependencies */}
            <div className={`max-w-full flex flex-col gap-0 overflow-y-auto my-2 gap-y-[0.4rem] max-h-[calc(100vh-200px)] scrollbar-none transition-all duration-200`}>
              {columns[col].map((task, i) => {

                return (
                  <div key={task.id} id={task.id} className="">
                    <TaskBLock
                      projectId={projectId}
                      showDependencies={showDependencies}
                      showAllSubtasks={showAllSubtasks}
                      col={col}
                      task={task}
                      handleDragStart={handleDragStart}
                      taskCategoryOptions={taskCategoryOptions}
                      setUsernameModal={setUsernameModal}
                      username={username}
                    />
                    {showDependencies && task.dependsOn && task.dependsOn.map((d) => (
                      <Xarrow
                        start={task.id} 
                        end={d.id} 
                        headSize={4}
                        strokeWidth={2}
                        color='#BABABA'
                        animateDrawing={true}
                    />
                    ))}
                  </div>
                );
              })}
            </div>
              <AddTask
                type="block"
                addModal={addModal}
                setAddModal={setAddModal}
                projectId={projectId}
                col={col}
                className="hidden group-hover/column:block"
                username={username}
              />
          </div>
        ))}
      </div>
    </>
  );
};

export default Project;
