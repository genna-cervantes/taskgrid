import React from "react";
import { Link } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { useUserContext } from "../contexts/UserContext";
import { CheckCircle2, ClipboardList, EllipsisVertical, Eye, Loader2, LockOpen } from "lucide-react";
import { useProjectDetailsStore } from "@/zustand/store";

const ProjectBlock = ({
  p,
  editProject,
  workspaceId,
  setEditProject,
  dropdownRef,
  setEditProjectModal,
  setManageProjectModal,
  setDeleteProjectModal,
}: {
  p: {
    id: string;
    name: string;
  };
  editProject: {
    projectId: string;
    projectName: string;
  };
  workspaceId: string;
  setEditProject: React.Dispatch<
    React.SetStateAction<{
      projectId: string;
      projectName: string;
    }>
  >;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  setEditProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
  setManageProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // check if owner
  const userContext = useUserContext();
  const utils = trpc.useUtils();

  const { data: ownerUsername } = trpc.projects.getProjectOwner.useQuery({ id: p.id });
  const { setProjectDetails } = useProjectDetailsStore();

  const { data: projectStats, isLoading: projectsStatsIsLoading } =
    trpc.projects.getProjectStats.useQuery({ projectId: p.id }) as {
      data:
        | {
            backlog: number;
            "in progress": number;
            "for checking": number;
            done: number;
          }
        | undefined;
      isLoading: boolean;
    };

  const isOwner = Boolean(ownerUsername) && userContext?.username === ownerUsername;

  return (
    <Link
      className="border border-faintWhite rounded-md h-28 px-4 py-4 flex flex-col justify-between cursor-pointer relative"
      to={`/workspaces/${workspaceId}/projects/${p.id}/board`}
    >
      <div className="flex justify-between">
        <h1 className="font-bold truncate text-sm text-white/80">
          {p.name}
        </h1>
      </div>
      {/* <h3 className="text-sm dark:text-midWhite text-midBlack">{p.id}</h3> */}
      {!projectsStatsIsLoading && projectStats && (
        <div className="flex justify-between w-full items-end text-fadedWhite">
          <div className="flex gap-x-1 text-xs items-end">
            <span className="flex items-center">
              <ClipboardList className="h-3" />
              <p>{projectStats["backlog"]}</p>
            </span>
            <span className="flex items-center">
              <Loader2 className="h-3" />
              <p>{projectStats["in progress"]}</p>
            </span>
            <span className="flex items-center">
              <Eye className="h-3" />
              <p>{projectStats["for checking"]}</p>
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="h-3" />
              <p>{projectStats["done"]}</p>
            </span>
          </div>
          <LockOpen className="h-4" >
            <title>Public Project</title>
          </LockOpen>
        </div>
      )}
    </Link>
  );
};

export default ProjectBlock;
