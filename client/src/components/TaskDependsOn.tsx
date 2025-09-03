import React from "react";
import MultiSelect from "./MultiSelect";
import { trpc } from "@/utils/trpc";
import { Link } from "lucide-react";

const TaskDependsOn = ({
  taskDependsOn,
  setTaskDependsOn,
  projectId,
  taskId,
  error,
  isPage = false,
}: {
  isPage?: boolean;
  taskId: string;
  projectId: string;
  taskDependsOn: {id: string, title: string}[]|undefined;
  error: string|undefined;
  setTaskDependsOn: React.Dispatch<React.SetStateAction<{id: string, title: string}[]>>;
}) => {
  const { data: tasks } = trpc.tasks.getTaskIds.useQuery({
    projectId,
  });

  let choices = tasks?.filter(t => t.id !== taskId) ?? [];

  return (
    <div className="w-full flex flex-row gap-x-4 items-center">
      <h3
        className={`${isPage ? "hidden" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Depends On:
      </h3>
      <Link className="h-4 w-4 text-midWhite" strokeWidth={3} />
      <MultiSelect
        placeholder="Select Task"
        isPage={isPage}
        value={taskDependsOn ?? []}
        setValue={setTaskDependsOn}
        choices={choices}
      />
      {error && (
        <p className="text-xs pb-2 text-red-400 !font-rubik text-start line-clamp-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default TaskDependsOn;
