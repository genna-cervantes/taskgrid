import React, { useState } from "react";
import { setUsernameForProject } from "../utils/indexedb";
import { trpc } from "../utils/trpc";

const UserNameModal = ({
  fromHome,
  projectId,
  setUsernameModal,
}: {
  fromHome: boolean;
  projectId: string;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const setUsernameInDb = trpc.setUsername.useMutation({
    onSuccess: (data) => {
      console.log("Name set:", data);
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const { data: usernames, isLoading } = trpc.getUsersInProject.useQuery({
    id: projectId,
  });

  const handleSaveName = async () => {
    if (!name) {
      setError("Name is required!");
      return;
    }

    if (name.length < 1) {
      setError("Name is required!");
      return;
    }

    if (name.length > 100) {
      setError("Name is too long!");
      return;
    }

    if (usernames?.includes(name)) {
      setError("This name has already been registed to this board!");
      return;
    }

    await setUsernameForProject(projectId, name);
    setUsernameInDb.mutate({ id: projectId, username: name });
    setUsernameModal(false);
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && fromHome) {
          setUsernameModal(false);
        } else {
          return;
        }
      }} // Close when clicking backdrop
    >
      <div
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <div className="flex justify-between items-center">
          <h1 className="text-sm font-bold">
            What name should others in this project call you?
          </h1>
          {fromHome && (
            <button
              onClick={() => setUsernameModal(false)}
              className="px-4 py-1 text-white text-sm font-semibold rounded-md bg-white/20 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
        <div className="w-full">
          <input
            type="text"
            placeholder="Karina Yoo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
          {error && (
            <p className="text-red-400 text-xs font-semibold mt-1">{error}</p>
          )}
        </div>
        <button
          onClick={handleSaveName}
          className="w-full bg-green-400 text-white font-semibold text-sm py-2 rounded-md cursor-pointer"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default UserNameModal;
