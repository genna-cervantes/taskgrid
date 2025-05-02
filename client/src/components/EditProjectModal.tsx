import React, { useEffect, useState } from "react";
import { getProjectNameByKey } from "../utils/indexedb";

const EditProjectModal = ({ projectId, setEditProjectModal, setEditModal }: { projectId: string, setEditProjectModal: React.Dispatch<React.SetStateAction<boolean>>, setEditModal: React.Dispatch<React.SetStateAction<string>> }) => {
  // get name of project
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const fetchProjectName = async () => {
      let projectName = await getProjectNameByKey(projectId);
      setProjectName(projectName ?? "");
    };

    fetchProjectName();
  }, []);

  useEffect(() => {
    console.log(projectName)
  }, [projectName])

  const [errors, setErrors] = useState("");

  const handleClickOutside = () => {
    setEditProjectModal(false)
    setEditModal("")
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
        onClick={handleClickOutside} // Close when clicking backdrop
    >
      <div
        id="edit-project-modal"
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <span className="w-full flex flex-col">
          <label htmlFor="name" className="text-xs font-semibold mb-2">
            Project Id:
          </label>
          <h1>{projectId}</h1>
        </span>
        <span className="w-full flex flex-col">
          <label htmlFor="name" className="text-xs font-semibold mb-2">
            Project Name:
          </label>
          <input
            type="text"
            id="name"
            placeholder="New Task Title..."
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          {errors && (
            <p className="text-red-400 text-xs font-semibold mt-1">{errors}</p>
          )}
        </span>
        <button className="bg-green-400 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer"
        >Save</button>
      </div>
    </div>
  );
};

export default EditProjectModal;
