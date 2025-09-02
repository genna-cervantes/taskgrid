import BreadCrumbs from "@/components/BreadCrumbs";
import { trpc } from "@/utils/trpc";
import React from "react";
import { useParams } from "react-router-dom";
import { Task } from "../../../server/src/shared/types";
import TaskPriority from "@/components/TaskPriority";
import TaskCategory from "@/components/TaskCategory";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const Triage = () => {
  const { workspaceId, projectId } = useParams();

  // check if workspace exists
  const { data: workspaceName, isLoading: workspaceExistsIsLoading } =
    trpc.workspaces.checkWorkspaceId.useQuery(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    );

  const { data: projectName, isLoading: projectNameIsLoading } =
    trpc.projects.getProjectNameByKey.useQuery(
      {
        id: projectId!,
      },
      { enabled: projectId !== "" }
    );

  return (
    <>
      <BreadCrumbs
        crumbs={[
          {
            name: workspaceName as string,
            url: `/workspaces/${workspaceId}`,
          },
          {
            name: projectName as string,
            url: `/workspaces/${workspaceId}/projects/${projectId}`,
          },
          {
            name: "triage",
            url: `/workspaces/${workspaceId}/projects/${projectId}/triage`,
          },
        ]}
      />
      <div className="w-full">
        <div className="flex items-center gap-x-4">
          <div className="flex gap-x-2 items-center">
            <p className="text-sm font-semibold">Open Tasks</p>
            <div className="bg-faintWhite/10 w-5 h-5 flex justify-center items-center font-semibold text-xs capitalize text-center font-noto rounded-full">
              3
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col gap-y-2 mt-3">
        <TriageTask />
      </div>
    </>
  );
};

const TriageTask = () => {
  return (
    <div className="w-full border border-faintWhite rounded-md px-3 py-3">
        <p className="text-xxs text-midWhite mb-2">{new Date().toLocaleDateString()} | 5d</p>

        <h1 className="text-sm font-bold">Task Title Here</h1>
        <div className="flex gap-x-2 items-center mt-1">
            {/* <TaskPriority className="text-sm" priority="low" /> */}
            <TaskCategory className="!text-xs" category="Category" taskCategoryOptions={[]} />
            <div className="border border-faintWhite rounded-md px-1">
                <p className="text-xs flex items-center gap-x-0"><User className="h-3 ml-[-0.4rem]" /> Genna Cervantes</p>
            </div>
        </div>
        
        <p className="text-xs mt-2">Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. </p>
        <div className="flex gap-x-2 mt-3">
            <Button className="text-xs text-white bg-inherit border border-faintWhite px-2 py-1">
                Accept to Backlog
            </Button>
            <Button className="text-xs text-white bg-inherit border border-faintWhite px-2 py-1">
                Mark as Duplicate
            </Button>
            <Button className="text-xs text-white bg-inherit border border-faintWhite px-2 py-1">
                Delete
            </Button>
        </div>
        <div className="w-full bg-purple-300/20 rounded-md px-2 py-1 mt-3 text-xs border-faintWhite border">
            <p className="text-xxs text-purple-300 font-bold mb-1">AI Suggestions</p>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. </p>
        </div>

    </div>
  );
};

export default Triage;
