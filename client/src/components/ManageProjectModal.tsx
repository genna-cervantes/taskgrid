import React from "react";
import { trpc } from "../utils/trpc";

const ManageProjectModal = ({
  editProject,
  setEditProject,
  setManageProjectModal,
}: {
  editProject: {
    projectId: string;
    projectName: string;
  };
  setEditProject: React.Dispatch<
    React.SetStateAction<{
      projectId: string;
      projectName: string;
    }>
  >;
  setManageProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  
  const utils = trpc.useUtils();

  const { data: usersInProject, isLoading: usersInProjectIsLoading } =
    trpc.getUsersInProject.useQuery({
      id: editProject.projectId,
    });

  const kickUser = trpc.kickUserFromProject.useMutation({
    onSuccess: () => {
      utils.getUsersInProject.invalidate()
    },
    onError: (error) => {
      console.log("error occured", error);
    },
  });

  const handleClickOutside = () => {
    console.log('hello')
    setManageProjectModal(false);
    console.log('hello2')
    setEditProject({
      projectId: "",
      projectName: "",
    });
  };

  const handleKick = (guestId: string) => {
    kickUser.mutate({ guestId, id: editProject.projectId });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (kickUser.isLoading) {
          e.stopPropagation();
        } else {
          handleClickOutside();
        }
      }} 
    >
      <div
        id="edit-project-modal"
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-[90%] md:w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <h1>
          Manage users of{" "}
          <span className="font-semibold">{editProject.projectName}</span>
        </h1>
        <div className="flex flex-col gap-y-2 px-4">
          {usersInProjectIsLoading && <p>Loading users...</p>}
          {usersInProject?.map((u) => (
            <div className="flex justify-between" key={u.guestId}>
              <h1>{u.username}</h1>
              <button
                onClick={() => handleKick(u.guestId)}
                className="bg-red-400 px-4 text-white text-xs md:text-sm font-semibold py-1 rounded-md cursor-pointer disabled:cursor-not-allowed"
                disabled={kickUser.isLoading}
              >
                {!kickUser.isLoading ? (
                  "Kick"
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-loader-circle-icon lucide-loader-circle animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageProjectModal;
