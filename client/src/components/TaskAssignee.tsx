import React from "react";
import SelectAssignee from "./SelectAssignee";
import { trpc } from "@/utils/trpc";
import { User2 } from "lucide-react";

const TaskAssignee = ({
  projectId,
  username,
  taskAssignedTo,
  setTaskAssignedTo,
  usersInProj,
  error,
  isPage = false,
}: {
  isPage?: boolean;
  projectId: string;
  username: string | undefined;
  usersInProj: string[];
  taskAssignedTo: string[];
  setTaskAssignedTo: React.Dispatch<React.SetStateAction<string[]>>;
  error: string | undefined;
}) => {

  return (
    <div className={`w-full flex ${isPage ? "flex-row gap-x-4 items-center" : "flex-col"}`}>
      <h3
        className={`${isPage ? "hidden" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Assign to:
      </h3>
      {isPage && <User2 className="h-4 w-4 text-midWhite" strokeWidth={3} />}

     <SelectAssignee
        isPage={isPage}
        setTaskAssignedTo={setTaskAssignedTo}
        taskAssignedTo={taskAssignedTo}
        username={username ?? ""}
        usersInProject={usersInProj}
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
