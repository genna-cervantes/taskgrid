import React from "react";
import { EditableDropdown } from "./EditableSelect";
import { trpc } from "@/utils/trpc";
import { Tag } from "lucide-react";

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
    <div className={`w-full flex ${isPage ? "flex-row gap-x-4 items-center" : "flex-col"}`}>
      <h3
        className={`${isPage ? "hidden" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Category:
      </h3>
      <div className="w-full flex flex-col gap-y-2">
        <div className="flex gap-x-4 w-full items-center">
          {isPage && <Tag className="h-4 w-4 text-midWhite" strokeWidth={3} />}
          {taskCategoryOptionsIsLoading ? 'Loading...' : <EditableDropdown projectId={projectId} taskCategory={taskCategory} setTaskCategory={setTaskCategory} taskCategoryOptions={taskCategoryOptions} setTaskCategoryOptions={setTaskCategoryOptions} isPage={isPage} />}
        </div>
        {error && <p className="text-xxs pb-2 text-red-400 text-start line-clamp-1">{error}</p>}
      </div>
    </div>
  );
};

export default TaskSelectCategory;