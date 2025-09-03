import BreadCrumbs from "@/components/BreadCrumbs";
import { useParams } from "react-router-dom";
import { trpc } from "@/utils/trpc";
import { Funnel, Github, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useProjectDetailsStore, useUsersInProjectStore } from "@/zustand/store";

const ManageProject = () => {
  const { workspaceId, projectId } = useParams();
  const { setProjectDetails, name, description, privacy, plan } =
    useProjectDetailsStore();

  const { data: projectDetails } = trpc.projects.getProjectDetails.useQuery(
    { projectId: projectId! },
    {
      enabled: projectId !== "" && name === "",
      onSuccess: (data) => setProjectDetails(data),
    }
  );

  const { data: workspaceName } = trpc.workspaces.checkWorkspaceId.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId }
  );

  const projectName = name || projectDetails?.name;
  const projectDescription = description || projectDetails?.description;
  const projectPrivacy = privacy || projectDetails?.privacy;
  const projectPlan = plan || projectDetails?.plan;

  const { usersInProject: usersInProjectStoreData } = useUsersInProjectStore();
  const { data: usersInProjectQueryData } = trpc.users.getUsernamesInProject.useQuery({
    id: projectId!,
  }, {
    enabled: projectId !== "" && usersInProjectStoreData.length === 0
  });
  const usersInProject = usersInProjectStoreData || usersInProjectQueryData;

  return (
    <>
      <BreadCrumbs
        crumbs={[
          { name: workspaceName as string, url: `/workspaces/${workspaceId}` },
          {
            name: projectName as string,
            url: `/workspaces/${workspaceId}/projects/${projectId}`,
          },
          {
            name: "manage",
            url: `/workspaces/${workspaceId}/projects/${projectId}/manage`,
          },
        ]}
      />

      <div>
        <div className="flex justify-between">
          <div className="flex gap-x-2 items-center">
            <h1 className="font-bold">{projectName}</h1>
            <div className="text-xxs px-2 flex items-center justify-center rounded-xl bg-yellow-300/20 border border-yellow-200">
              {projectPlan &&
                projectPlan.charAt(0).toUpperCase() + projectPlan.slice(1)}{" "}
              Plan
            </div>
          </div>
        </div>
        <div className="text-sm mt-2 min-h-24">
          {projectDescription ?? "Write about your project here"}
        </div>

        {/* privacy */}
        <div className="w-full mt-4">
          <div className="flex gap-x-2 mt-2">
            <div className="flex gap-x-1 items-center">
              <p className="text-sm">Public Project</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 text-midWhite" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-backgroundDark text-fadedWhite mb-2">
                    <p>visible to everyone, even users outside your project</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={projectPrivacy === "public"}
              className="data-[state=checked]:bg-fadedWhite data-[state=unchecked]:bg-faintWhite "
            />
          </div>
        </div>

        {/* users */}
        <div className="w-full mt-4">
          <div className="flex gap-x-4">
            <div className="flex items-center gap-x-2">
              <h2 className="text-sm">Users</h2>
              <div className="bg-faintWhite/10 w-5 h-5 flex justify-center items-center font-semibold text-xs capitalize text-center font-noto rounded-full">
                3
              </div>
            </div>
            <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
              <Funnel className="h-3" />
              <p>Filter</p>
            </button>
          </div>
          <div className="mt-2 w-full max-h-44 overflow-auto super-thin-scrollbar">
            {usersInProject.map((user) => (
              <div className="w-full border border-faintWhite flex justify-between gap-x-8 rounded-md px-2 py-2 items-center">
                <div>
                  <h1 className="text-sm">{user.username}</h1>
                </div>
                <div className="flex gap-x-2">
                  <button className="border border-faintWhite text-xs px-2 rounded-md py-1">
                    Make Admin
                  </button>
                  <button className="border border-faintWhite text-xs px-2 rounded-md py-1">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* integrations */}
        <div className="mt-4 w-full">
          <h2 className="text-sm">Integrations</h2>
          <div className="mt-2 w-full">
            <div className="w-full border border-faintWhite flex justify-between gap-x-8 rounded-md px-2 py-2 items-center">
              <div>
                <span className="flex gap-x-1 items-center">
                  <Github className="h-4" />
                  <h1 className="text-sm font-bold">Github</h1>
                </span>
                <p className="text-xs mt-2">
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nisi
                  minus autem omnis illum consequatur, cumque sint nostrum
                </p>
              </div>
              <button className="border border-faintWhite text-xs px-2 rounded-md py-1">
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageProject;
