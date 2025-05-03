import React, { useEffect, useState } from "react";
import { deleteProjectById, getProjectNameByKey } from "../utils/indexedb";

const DeleteProjectModal = ({
  projectId,
  setDeleteProjectModal,
  setEditModal,
}: {
  projectId: string;
  setDeleteProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditModal: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const getProjectName = async () => {
      let name = await getProjectNameByKey(projectId);
      setProjectName(name ?? "");
    };

    getProjectName();
  }, [projectId]);

  const handleClickOutside = () => {
    setDeleteProjectModal(false);
    setEditModal("");
  };

  const handleLeave = async () => {
    // delete from indexedb
    await deleteProjectById(projectId);
    setDeleteProjectModal(false);
    setEditModal("");
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={handleClickOutside}
    >
      <div
        id="edit-project-modal"
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <h1>
          Are you sure you want to leave{" "}
          <span className="font-bold">{projectName}</span>?
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
