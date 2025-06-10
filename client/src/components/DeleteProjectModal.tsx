import React from "react";
import { trpc } from "../utils/trpc";
import { useGuestId } from "../contexts/UserContext";

const DeleteProjectModal = ({
  editProject,
  setEditProject,
  setDeleteProjectModal,
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
  setDeleteProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const userContext = useGuestId();
  const utils = trpc.useUtils();

  const deleteProject = trpc.deleteProject.useMutation({
    onSuccess: (data) => {
      console.log("Project created:", data);
      utils.getUserProjects.invalidate();
      setDeleteProjectModal(false);
      setEditProject({
        projectId: "",
        projectName: "",
      });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const handleClickOutside = () => {
    setDeleteProjectModal(false);
    setEditProject({
      projectId: "",
      projectName: "",
    });
  };

  const handleLeave = () => {
    deleteProject.mutate({
      id: editProject.projectId,
      guestId: userContext.guestId ?? "",
    });
  };

  if (
    userContext.isLoading &&
    userContext.guestId == null &&
    !userContext.guestId
  ) {
    return <>Loading Guest ID...</>;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (deleteProject.isLoading) {
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
          Are you sure you want to leave{" "}
          <span className="font-bold">{editProject.projectName}</span>?
        </h1>
        <button
          onClick={() => handleLeave()}
          className="bg-red-400 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer disabled:cursor-not-allowed"
          disabled={deleteProject.isLoading}
        >
          {!deleteProject.isLoading ? (
            "Leave"
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
    </div>
  );
};

export default DeleteProjectModal;
