import React, { useEffect, useState } from "react";
import {
  Outlet,
  useMatch,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { trpc } from "../utils/trpc";
import { Columns, ColumnKey } from "../../../server/src/shared/types";
import Mousetrap from "mousetrap";
import ProjectColumn from "@/components/ProjectColumn";
import AddTaskForm from "@/components/AddTaskForm";

const Project = () => {
  const { projectId } = useParams();
  const isTaskRoute = useMatch("/projects/:projectId/tasks/*");
  const utils = trpc.useUtils();
  
  const groupBy = localStorage.getItem("groupBy") ?? "progress";

  const [addModal, setAddModal] = useState("");
  const [showDependencies, setShowDependencies] = useState(false);
  const [showAllSubtasks, setShowAllSubtasks] = useState(localStorage.getItem("showAllSubtasks") === "true");

  const {
    username,
    columns: rawColumns,
    taskCategoryOptions,
  } = useOutletContext<{
    username: string | undefined;
    columns: Columns;
    taskCategoryOptions: { category: string; color: string }[] | undefined;
  }>();

  if (!rawColumns) {
    return (
      <p className="text-sm opacity-50 text-center mt-8">
        Loading your taskan board...
      </p>
    );
  }

  const [columns, setColumns] = useState<Columns>(rawColumns);
  useEffect(() => {
    // Update columns when rawColumns changes
    setColumns(rawColumns);
  }, [rawColumns]);

  const updateTaskOrderBatched = trpc.tasks.updateTaskOrderBatched.useMutation({
    onSuccess: (data) => {
      console.log("Task ordered:", data);
      utils.tasks.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to order tasks:", error.message);
    },
  });

  // drag and drop
  const persistTaskMove = async (
    payload: { taskId: string; progress: string; index: number }[]
  ) => {
    if (payload.length > 0) {
      updateTaskOrderBatched.mutate({ payload, projectId: projectId ?? "" });
    }
  };

  // keyboard shortcuts
  useEffect(() => {
    Mousetrap.bind("ctrl+alt+n", function (e) {
      e.preventDefault();
      setAddModal("backlog");
    });

    Mousetrap.bind("ctrl+alt+d", function (e) {
      e.preventDefault();
      setShowDependencies((prev) => !prev);
    });

    Mousetrap.bind("ctrl+alt+s", function (e) {
      e.preventDefault();
      setShowAllSubtasks((prev) => {
        const newVal = !prev;
        localStorage.setItem("showAllSubtasks", newVal.toString());
        return newVal;
      });
    });

    return () => {
      Mousetrap.unbind("ctrl+alt+n");
      Mousetrap.unbind("ctrl+alt+d");
      Mousetrap.unbind("ctrl+alt+s");
    };
  }, []);

  // should redirect to not found
  if (!projectId) {
    return <div>missing project id</div>;
  }

  if (isTaskRoute) {
    return <Outlet />;
  }

  return (
    <>
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 overflow-auto"> */}
      <div className="grid grid-flow-col auto-cols-[24%] overflow-x-auto gap-4 overflow-y-hidden super-thin-scrollbar ">
        {(Object.keys(columns) as ColumnKey[]).map((col) => (
          <React.Fragment key={col}>
            <ProjectColumn
              col={col}
              columns={columns}
              columnKey={groupBy}
              setAddModal={setAddModal}
              taskCategoryOptions={taskCategoryOptions}
              projectId={projectId}
              username={username}
              showDependencies={showDependencies}
              showAllSubtasks={showAllSubtasks}
              persistTaskMove={persistTaskMove}
            />
            {
              addModal === col && <AddTaskForm username={username} projectId={projectId} col={col} setAddModal={setAddModal} />
            }
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default Project;
