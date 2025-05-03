import React from "react";
import { Link } from "react-router-dom";

const ProjectBlock = ({
  p,
  handleClickOptions,
  editModal,
  dropdownRef,
  setEditProjectModal,
  setDeleteProjectModal
}: {
  p: {
    id: string;
    name: string;
  };
  handleClickOptions: (id: string) => void;
  editModal: string;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  setEditProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Link
      className="bg-[#282828] rounded-md h-28 px-4 py-4 flex flex-col justify-between cursor-pointer relative"
      to={`/projects/${p.id}`}
      state={{ from: "home" }
    }
    >
      <div className="flex justify-between">
        <h1 className="font-bold">{p.name}</h1>
        <div className="relative">
          <button
            className="cursor-pointer px-1 py-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClickOptions(p.id);
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

          {editModal === p.id && (
            <div
              ref={dropdownRef}
              className="z-[99] absolute top-full right-0 mt-2 bg-[#3a3a3a] p-2 rounded-md shadow-lg z-50 w-max flex flex-col gap-y-2 text-sm"
            >
              <button
                onClick={(e) => {
                  setEditProjectModal(true);
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full h-1/2 hover:bg-white/20 text-white  p-2 px-4 rounded-md cursor-pointer"
              >
                edit project
              </button>
              <button onClick={(e) => {
                setDeleteProjectModal(true);
                e.preventDefault();
                e.stopPropagation()
              }} className="w-full h-1/2 hover:bg-red-400 text-white  p-2 px-4 rounded-md cursor-pointer">
                leave project
              </button>
            </div>
          )}
        </div>
      </div>
      <h3 className="text-sm">{p.id}</h3>
    </Link>
  );
};

export default ProjectBlock;
