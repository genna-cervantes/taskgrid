import React from "react";
import { Link } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { useGuestId } from "../contexts/UserContext";

const ProjectBlock = ({
  p,
  editProject,
  setEditProject,
  dropdownRef,
  setEditProjectModal,
  setManageProjectModal,
  setDeleteProjectModal
}: {
  p: {
    id: string;
    name: string;
  };
  editProject: {
    projectId: string,
    projectName: string
  },
  setEditProject: React.Dispatch<React.SetStateAction<{
    projectId: string;
    projectName: string;
  }>>
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  setEditProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
  setManageProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {

  // check if owner
  const userContext = useGuestId();
  const {data: ownerGuestId} = trpc.getProjectOwner.useQuery({id: p.id})

  const isOwner = Boolean(ownerGuestId) && userContext?.guestId === ownerGuestId ;

  return (
    <Link
      className="dark:bg-backgroundDark bg-lmMidBackground rounded-md h-28 px-4 py-4 flex flex-col justify-between cursor-pointer relative"
      to={`/projects/${p.id}`}
      state={{ from: "home" }}
    >
      <div className="flex justify-between">
        <h1 className="font-bold truncate dark:text-fadedWhite text-fadedBlack">{p.name}</h1>
        <div className="relative">
          <button
            title="Edit Project"
            className="cursor-pointer px-1 py-1 dark:text-fadedWhite text-fadedBlack hover:dark:text-midWhite hover:text-midBlack"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (editProject.projectId === p.id) {
                setEditProject({ projectId: "", projectName: "" });
              } else {
                setEditProject({ projectId: p.id, projectName: p.name });
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-ellipsis-vertical"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {editProject.projectId === p.id && (
            <div
              ref={dropdownRef}
              className="z-10 absolute top-full right-0 mt-2 bg-lmBackground dark:bg-[#3a3a3a] p-2 rounded-md shadow-lg w-max flex flex-col gap-y-2 text-sm"
            >
              <button
                onClick={(e) => {
                  setEditProjectModal(true);
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full h-1/2 dark:hover:bg-white/20 hover:bg-lmMidBackground dark:text-white text-fadedBlack  p-2 px-4 rounded-md cursor-pointer"
              >
                edit project
              </button>
              {isOwner && <button
                onClick={(e) => {
                  setManageProjectModal(true);
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full h-1/2 dark:hover:bg-white/20 hover:bg-lmMidBackground dark:text-white text-fadedBlack p-2 px-4 rounded-md cursor-pointer"
              >
                manage project
              </button>}
              <button onClick={(e) => {
                setDeleteProjectModal(true);
                e.preventDefault();
                e.stopPropagation()
              }} className="w-full h-1/2 hover:bg-red-400 dark:text-white text-fadedBlack p-2 px-4 rounded-md cursor-pointer">
                leave project
              </button>
            </div>
          )}
        </div>
      </div>
      <h3 className="text-sm dark:text-midWhite text-midBlack">{p.id}</h3>
    </Link>
  );
};

export default ProjectBlock;
