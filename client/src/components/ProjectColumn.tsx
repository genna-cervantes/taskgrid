import React from "react";
import { ColumnKey, Columns, Task } from "../../../server/src/shared/types";
import { Ellipsis } from "lucide-react";
import AddTask from "./AddTask";
import TaskBlock, { DropIndicator } from "./TaskBlock";
import Xarrow from "react-xarrows";

const ProjectColumn = ({
  col,
  columns,
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
  columns: Columns;
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
  persistTaskMove: (payload: {
    taskId: string;
    progress: "backlog" | "in progress" | "for checking" | "done";
    index: number;
}[]) => Promise<void>
}) => {

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string, progress: string) => {
    e.dataTransfer.setData("taskId", taskId)
    e.dataTransfer.setData("col", progress)
  }
  
  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${col}"]`))
  }
  
  const getNearestIndicator = (e: React.DragEvent<HTMLDivElement>, indicators: Element[]) => {
    const nearest = indicators.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = e.clientY - (box.top + 10)
      
      if (offset < 0 && offset > closest.offset){
        return {offset, element: child}
      }else{
        return closest;
      }
    }, {
      offset: Number.NEGATIVE_INFINITY,
      element: indicators[indicators.length - 1]
    })
    
    return nearest
  }

  const clearHighlights = (els?: Element[]) => {
    const indicators = els || getIndicators();

    indicators.forEach((i: Element) => i.style.opacity = "0")

  }
  
  const highlightIndicators = (e: React.DragEvent<HTMLDivElement>) => {
    const indicators = getIndicators()
    clearHighlights(indicators)

    const nearest = getNearestIndicator(e, indicators)

    nearest.element.style.opacity = "1";
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    highlightIndicators(e)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    clearHighlights();
  }

  const handleDragEnd = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    clearHighlights()

    const taskId = e.dataTransfer.getData("taskId") // task being dragged
    const taskCol = e.dataTransfer.getData("col") as ColumnKey // task being dragged

    const indicators = getIndicators()
    const nearestIndicator = getNearestIndicator(e, indicators)

    const beforeId = nearestIndicator.element.dataset.before || "-1" // task after idrop ung task being dragged

    const payload: {taskId: string, progress: ColumnKey, index: number}[] = []

    if (beforeId !== taskId) {

      // get card
      let taskToMove = columns[taskCol].find((t) => t.id === taskId)
      if (!taskToMove) return;

      // if same column // update only one column [0, 1, 2, 3]
      const beforeIndex = columns[col].find((t) => t.id === beforeId)?.index ?? columns[col].length// index of beforeId
      const taskIndex = taskToMove.index
      
      if (taskCol === col){  
        if (beforeIndex -1 >= taskIndex){
          payload.push({taskId, progress: taskCol, index: beforeIndex -1})
          payload.push(...columns[col].filter((t) => t.index > taskIndex && t.index <= beforeIndex -1 && t.index !== taskIndex).map((t) => ({taskId: t.id, progress: taskCol, index: t.index - 1})))
        }else if (beforeIndex -1 < taskIndex){
          payload.push({taskId, progress: taskCol, index: beforeIndex})
          payload.push(...columns[col].filter((t) => t.index < taskIndex && t.index >= beforeIndex && t.index !== taskIndex).map((t) => ({taskId: t.id, progress: taskCol, index: t.index + 1})))
        }
      }else{
        // handles from column
        payload.push(...columns[taskCol].filter((t) => t.index > taskIndex).map((t) => ({taskId: t.id, index: t.index - 1, progress: t.progress as ColumnKey})))

        // handles to column
        payload.push({taskId, progress: col, index: beforeIndex})
        payload.push(...columns[col].filter((t) => t.index < taskIndex && t.index >= beforeIndex && t.index !== taskIndex).map((t) => ({taskId: t.id, progress: col, index: t.index + 1})))
        
      }
    }
    await persistTaskMove(payload)
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

      <div
        className={`max-w-full flex flex-col gap-0 overflow-y-auto mb-2 h-[calc(100vh-200px)] scrollbar-none transition-all duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDragEnd}
      >
        {columns[col] && columns[col].sort((a, b) => a.index - b.index).map((task, i) => {

          return (
            <div key={task.id} id={task.id} className="">
              <TaskBlock
                handleDragStart={handleDragStart}
                projectId={projectId}
                showDependencies={showDependencies}
                showAllSubtasks={showAllSubtasks}
                col={col}
                task={task}
                taskCategoryOptions={taskCategoryOptions}
                setUsernameModal={setUsernameModal}
                username={username}
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
        <DropIndicator beforeId="-1" column={col} />
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
    </div>
  );
};

export default ProjectColumn;
