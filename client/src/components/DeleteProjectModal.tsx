import React from "react";
import { trpc } from "../utils/trpc";
import { useGuestId } from "../contexts/UserContext";

const DeleteProjectModal = ({
  editProject,
  setEditProject,
  setDeleteProjectModal,
}: {
  editProject: {
    projectId: string,
    projectName: string
  },
  setEditProject: React.Dispatch<React.SetStateAction<{
    projectId: string;
    projectName: string;
  }>>
  setDeleteProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {

  const guestId = useGuestId()
  const utils = trpc.useUtils()

  const deleteProject = trpc.deleteProject.useMutation({
    onSuccess: (data) => {
      console.log("Project created:", data);
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  })

  const handleClickOutside = () => {
    setDeleteProjectModal(false);
    setEditProject({
      projectId: "",
      projectName: ""
    });
  };

  const handleLeave = () => {
    deleteProject.mutate({id: editProject.projectId, guestId})
    utils.getUserProjects.invalidate()
    setDeleteProjectModal(false);
    setEditProject({
      projectId: "",
      projectName: ""
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={handleClickOutside}
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
          className="bg-red-400 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer"
        >
          Leave
        </button>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
