import React from "react";
import SelectAssignee from "./SelectAssignee";
import { trpc } from "@/utils/trpc";

const TaskAssignee = ({
  projectId,
  username,
  taskAssignedTo,
  setTaskAssignedTo,
  error,
  isPage = false,
}: {
  isPage?: boolean;
  projectId: string;
  username: string | undefined;
  taskAssignedTo: string[];
  setTaskAssignedTo: React.Dispatch<React.SetStateAction<string[]>>;
  error: string | undefined;
}) => {
  const { data: usersInProject } = trpc.users.getUsernamesInProject.useQuery({
    id: projectId,
  });

  console.log('users in proj', usersInProject);

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
      {error && (
        <p className="text-xs pb-2 text-red-400 !font-rubik text-start line-clamp-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default TaskAssignee;
