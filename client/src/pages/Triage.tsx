import BreadCrumbs from "@/components/BreadCrumbs";
import { trpc } from "@/utils/trpc";
import { useParams } from "react-router-dom";
import TaskCategory from "@/components/TaskCategory";
import { Button } from "@/components/ui/button";
import { Funnel, User } from "lucide-react";
import { useProjectDetailsStore } from "@/zustand/store";
import TaskPriority from "@/components/TaskPriority";

const Triage = () => {
  const { workspaceId, projectId } = useParams();
  const { name } = useProjectDetailsStore();

  // check if workspace exists
  const { data: workspaceName } = trpc.workspaces.checkWorkspaceId.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId }
  );

  const { data: projectNameQueryData } =
    trpc.projects.getProjectNameByKey.useQuery(
      {
        id: projectId!,
      },
      { enabled: projectId !== "" && name === "" }
    );

  const projectName = name || projectNameQueryData;

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
      <div>
        <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
            <Funnel className="h-3" />
            <p>Filter</p>
          </button>  
      </div>
      <div className="w-full mt-3">
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
      <p className="text-xxs text-midWhite mb-2">
        {new Date().toLocaleDateString()} | 5d
      </p>

      <h1 className="text-sm font-bold">Task Title Here</h1>
      <div className="flex gap-x-2 items-center mt-1">
        <TaskPriority className="text-sm" priority="low" />
        <TaskCategory
          className=""
          category="Category"
          taskCategoryOptions={[]}
        />        
      </div>

      <p className="text-xs mt-2">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.{" "}
      </p>

      <p className="text-xs mt-2 flex items-center gap-x-0">
        <User className="h-3 ml-[-0.4rem]" /> Genna Cervantes
      </p>

      <div className="flex gap-x-2 mt-3">
        <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
          Accept to Backlog
        </Button>
        <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
          Mark as Duplicate
        </Button>
        <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
          Delete
        </Button>
      </div>
      <div className="w-full bg-purple-300/20 rounded-md px-2 py-1 mt-3 text-xs border-faintWhite border">
        <p className="text-xxs text-purple-300 font-bold mb-1">
          AI Suggestions
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
          quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
          Quisquam, quos.{" "}
        </p>
      </div>
    </div>
  );
};

export default Triage;
