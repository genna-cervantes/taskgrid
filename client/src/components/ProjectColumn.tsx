import React from "react";
import { ColumnKey, Columns, Task } from "../../../server/src/shared/types";
import { Ellipsis } from "lucide-react";
import AddTask from "./AddTask";
import TaskBlock from "./TaskBlock";
import Xarrow from "react-xarrows";

const ProjectColumn = ({
  col,
  colTasks,
  setColumns,
  addModal,
  setAddModal,
  projectId,
  username,
  showDependencies,
  showAllSubtasks,
  taskCategoryOptions,
  setUsernameModal,
  persistTaskMove
}: {
  col: ColumnKey;
  colTasks: Task[];
  setColumns: React.Dispatch<React.SetStateAction<Columns>>;
  addModal: boolean;
  setAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  projectId: string;
  username: string | undefined;
  showDependencies: boolean;
  showAllSubtasks: boolean;
  taskCategoryOptions:
    | {
        category: string;
        color: string;
      }[]
    | undefined;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
  persistTaskMove: (taskId: string, fromColumn: ColumnKey, toColumn: ColumnKey, toIndex: number) => Promise<void>
}) => {

    const moveCard = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;

        const updated = [...colTasks];
        const [movedTask] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, movedTask);

        setColumns((prev) => ({
            ...prev,
            [col]: updated.sort((a, b) => a.index - b.index)
        }))
    };

    const moveAcrossColumnPreview = (taskId: string, fromColumn: ColumnKey, toColumn: ColumnKey, toIndex: number) => {
        setColumns((prev) => {
            const from = [...prev[fromColumn]]
            const to = [...prev[toColumn]]

            const taskIndex = from.findIndex((t) => t.id === taskId);
            if (taskIndex === -1) return prev;

            const [movedTask] = from.splice(taskIndex, 1);
            if (!movedTask) return prev;
            
            const updatedTask = {
                ...movedTask,
                progress: toColumn
            };

            const insertIndex = Math.min(Math.max(0, toIndex), to.length);
            to.splice(insertIndex, 0, updatedTask)

            return {
                ...prev,
                [fromColumn]: from,
                [toColumn]: to.sort((a, b) => a.index - b.index)
            }
        })
    }

  return (
    <div
      key={col}
      className="flex-1 px-3 py-3 dark:bg-backgroundDark bg-lmMidBackground rounded-md border-[1px] dark:border-faintWhite/5 border-faintBlack/5 group/column"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-2">
          <h2 className="font-semibold text-sm capitalize py-1 text-center font-noto">
            {col}
          </h2>
          <div className="px-2 flex justify-center items-center font-semibold text-xs capitalize py-1 text-center font-noto rounded-full bg-gray-500/20">
            {colTasks.length}
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
      <div
        className={`max-w-full flex flex-col gap-0 overflow-y-auto my-2 gap-y-[0.4rem] max-h-[calc(100vh-200px)] scrollbar-none transition-all duration-200`}
      >
        {colTasks && colTasks.sort((a, b) => a.index - b.index).map((task, i) => {

        //   console.log(task)

          return (
            <div key={task.id} id={task.id} className="">
              <TaskBlock
                projectId={projectId}
                showDependencies={showDependencies}
                showAllSubtasks={showAllSubtasks}
                col={col}
                task={task}
                taskCategoryOptions={taskCategoryOptions}
                setUsernameModal={setUsernameModal}
                username={username}
                moveCard={moveCard}
                moveAcrossColumnPreview={moveAcrossColumnPreview}
                persistTaskMove={persistTaskMove}
              />
              {showDependencies &&
                task.dependsOn &&
                task.dependsOn.map((d) => (
                  <Xarrow
                    start={task.id}
                    end={d.id}
                    headSize={4}
                    strokeWidth={2}
                    color="#BABABA"
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
  );
};

export default ProjectColumn;
