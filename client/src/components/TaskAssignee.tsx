import React from "react";
import SelectAssignee from "./SelectAssignee";
import { trpc } from "@/utils/trpc";

const TaskAssignee = ({
  projectId,
  username,
  taskAssignedTo,
  setTaskAssignedTo,
  taskAssignedToError,
  isPage = false,
}: {
  isPage?: boolean;
  projectId: string;
  username: string | undefined;
  taskAssignedTo: string[];
  setTaskAssignedTo: React.Dispatch<React.SetStateAction<string[]>>;
  taskAssignedToError: string;
}) => {
  const { data: usersInProject } = trpc.users.getUsernamesInProject.useQuery({
    id: projectId,
  });

  return (
    <div>
      <h3
        className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Assign to:
      </h3>

      <SelectAssignee
        isPage={isPage}
        setTaskAssignedTo={setTaskAssignedTo}
        taskAssignedTo={taskAssignedTo}
        username={username ?? ""}
        usersInProject={usersInProject ?? []}
      />
      {taskAssignedToError !== "" && (
        <h4 className={`font-semibold text-xs text-red-400 mt-1`}>
          {taskAssignedToError}
        </h4>
      )}
    </div>
  );
};

export default TaskAssignee;
