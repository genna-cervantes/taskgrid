import React from "react";
import MultiSelect from "./MultiSelect";
import { trpc } from "@/utils/trpc";

const TaskDependsOn = ({
  taskDependsOn,
  setTaskDependsOn,
  projectId,
  taskId,
  isPage = false,
}: {
  isPage?: boolean;
  taskId: string;
  projectId: string;
  taskDependsOn: {id: string, title: string}[]|undefined;
  setTaskDependsOn: React.Dispatch<React.SetStateAction<{id: string, title: string}[]>>;
}) => {
  const { data: tasks } = trpc.getTaskIds.useQuery({
    projectId,
  });

  let choices = tasks?.filter(t => t.id !== taskId) ?? [];

  console.log('td', taskDependsOn)

  return (
    <div className="w-full">
      <h3
        className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Depends On:
      </h3>
      <MultiSelect
        placeholder="Select Task To Depend On"
        isPage={isPage}
        value={taskDependsOn ?? []}
        setValue={setTaskDependsOn}
        choices={choices}
      />
    </div>
  );
};

export default TaskDependsOn;
