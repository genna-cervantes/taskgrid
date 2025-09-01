import React from "react";
import { EditableDropdown } from "./EditableSelect";
import { trpc } from "@/utils/trpc";

const TaskSelectCategory = ({
  taskCategory,
  setTaskCategory,
  taskCategoryOptions,
  taskCategoryOptionsIsLoading,
  setTaskCategoryOptions,
  error,
  projectId,
  isPage=false
}: {
  isPage?: boolean;
  taskCategory: string | undefined;
  taskCategoryOptionsIsLoading: boolean;
  setTaskCategory: React.Dispatch<React.SetStateAction<string | undefined>>;
  setTaskCategoryOptions: React.Dispatch<React.SetStateAction<{
    category: string;
    color: string;
}[]>>
  taskCategoryOptions: { color: string; category: string }[];
  projectId: string,
  error: string|undefined
}) => {

  return (
    <div className="w-full ">
      <h3
        className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Category:
      </h3>
      <div className="flex gap-x-6 w-full">
        {taskCategoryOptionsIsLoading ? 'Loading...' : <EditableDropdown projectId={projectId} taskCategory={taskCategory} setTaskCategory={setTaskCategory} taskCategoryOptions={taskCategoryOptions} setTaskCategoryOptions={setTaskCategoryOptions} isPage={isPage} />}
      </div>
      {error && <p className="text-xs pb-2 text-red-400 !font-rubik text-start line-clamp-1">{error}</p>}
    </div>
  );
};

export default TaskSelectCategory;