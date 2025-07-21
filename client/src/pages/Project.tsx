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
import ProjectColumn from "@/components/ProjectColumn";


const Project = () => {
  const { projectId } = useParams();
  const isTaskRoute = useMatch("/projects/:projectId/tasks/*");
  const utils = trpc.useUtils();

  const [addModal, setAddModal] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  const [showAllSubtasks, setShowAllSubtasks] = useState(false);

  const { setUsernameModal, username, columns: rawColumns, taskCategoryOptions } = useOutletContext<{
    setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
    username: string | undefined;
    columns: Columns;
    taskCategoryOptions: {category: string, color: string}[]|undefined
  }>();

  if (!rawColumns) {
    return (
      <p className="text-sm opacity-50 text-center mt-8">
        Loading your taskan boards...
      </p>
    );
  }

  const [columns, setColumns] = useState<Columns>(rawColumns);
  useEffect(() => {
      // Update columns when rawColumns changes
      setColumns(rawColumns);
  }, [rawColumns]);

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

  const updateTaskOrderBatched = trpc.updateTaskOrderBatched.useMutation({
    onSuccess: (data) => {
      console.log("Task ordered:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to order tasks:", error.message);
    },
  })

  // drag and drop
 const persistTaskMove = async (taskId: string, fromColumn: ColumnKey, toColumn: ColumnKey, toIndex: number) => {
    const fromTasks = columns[fromColumn];
    const toTasks = columns[toColumn];

    const payload = [];

    for (let i = 0; i < fromTasks.length; i++){
      const t = fromTasks[i];
      if (t.index !== i || t.progress !== fromColumn){
        payload.push({
          taskId: t.id,
          index: i,
          progress: fromColumn
        })
      }
    }

    for (let i = 0; i < toTasks.length; i++){
      const t = toTasks[i];
      if (t.index !== i || t.progress !== toColumn){
        payload.push({
          taskId: t.id,
          index: i,
          progress: toColumn
        })
      }
    }

    if (payload.length > 0) {
      updateTaskOrderBatched.mutate({payload, projectId: projectId ?? ""});
    }
 }

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
          <React.Fragment key={col}>
            <ProjectColumn
              col={col}
              colTasks={columns[col]}
              setColumns={setColumns}
              addModal={addModal}
              setAddModal={setAddModal}
              taskCategoryOptions={taskCategoryOptions}
              projectId={projectId}
              username={username}
              showDependencies={showDependencies}
              showAllSubtasks={showAllSubtasks}
              setUsernameModal={setUsernameModal}
              persistTaskMove={persistTaskMove}
             />
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default Project;
