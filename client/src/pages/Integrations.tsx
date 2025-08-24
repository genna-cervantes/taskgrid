import BreadCrumbs from "@/components/BreadCrumbs";
import { trpc } from "@/utils/trpc";
import { Github } from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";

const Integrations = () => {
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
            name: "integrations",
            url: `/workspaces/${workspaceId}/projects/${projectId}/integrations`,
          },
        ]}
      />
      <div className="w-full flex flex-col gap-y-4">
        <div className="w-full border border-faintWhite flex justify-between gap-x-8 rounded-md px-4 py-4 items-center">
            <div>
                <span className="flex gap-x-2 items-center">
                    <Github className="h-5" />
                    <h1 className="text-sm font-bold">Github</h1>
                </span>
                <p className="text-xs mt-2">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nisi minus autem omnis illum consequatur, cumque sint nostrum accusantium sequi hic ex at ratione voluptatibus, quibusdam dignissimos officiis, nemo cupiditate explicabo.</p>
            </div>
            <button className="border border-faintWhite text-sm px-2 py-1 rounded-md">Connect</button>
        </div>
      </div>
    </>
  );
};

export default Integrations;
