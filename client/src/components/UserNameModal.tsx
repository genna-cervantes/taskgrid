import React, { useState } from "react";
import { trpc } from "../utils/trpc";
import { useGuestId } from "../contexts/UserContext";

const UserNameModal = ({
  fromHome,
  projectId,
  setUsernameModal,
}: {
  fromHome: boolean;
  projectId: string;
  setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  
  const utils = trpc.useUtils()
  const guestId = useGuestId()

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [guestIdModal, setGuestIdModal] = useState(false);
  const [provideGuestId, setProvideGuestId] = useState("");
  const [provideGuestIdError, setProvideGuestIdError] = useState("");

  const setUsernameInDb = trpc.setUsername.useMutation({
    onSuccess: (data) => {
      console.log("Name set:", data);
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const { data: users } = trpc.getUsersInProject.useQuery({
    id: projectId,
  });

  const handleSaveName = async () => {
    // data checks
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

    if (users?.some((u) => u.username === name)) {
      setError("This name has already been registed to this board!");
      return;
    }

    setUsernameInDb.mutate({ id: projectId, username: name, guestId });
    utils.getUsername.invalidate()
    setUsernameModal(false);
  };

  const handleSaveProvideGuestId = () => {
    if (!provideGuestId) {
      setProvideGuestIdError("Guest ID is required!");
      return;
    }

    if (provideGuestId.length < 1) {
      setProvideGuestIdError("Guest ID is required!");
      return;
    }

    if (provideGuestId.length > 36) {
      setProvideGuestIdError("Guest ID is invalid!");
      return;
    }

    if (!users?.some((u) => u.guestId === provideGuestId)) {
      setProvideGuestIdError("The Guest ID provided is not registered to this project!");
      return;
    }    

    utils.getUsername.invalidate;
    localStorage.setItem("guestId", provideGuestId)
    setUsernameModal(false);
    setGuestIdModal(false);
  }

  return (
    <>
      {/* provide guest id modal */}
      {guestIdModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div
          className="bg-[#464646] rounded-lg shadow-xl p-8 w-full max-w-xl flex flex-col gap-y-4"
          onClick={(e) => e.stopPropagation()} // Prevent close on modal click
        >
          <div className="flex justify-between items-center">
            <h1 className="font-bold">
              Please provide your Guest ID:
            </h1>
            <button
              onClick={() => setGuestIdModal(false)}
              className="px-4 py-1 text-white text-sm font-semibold rounded-md bg-white/20 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="w-full">
            <input
              type="text"
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              value={provideGuestId}
              onChange={(e) => setProvideGuestId(e.target.value)}
              className="w-full"
            />
            {provideGuestIdError && (
              <p className="text-red-400 text-xs font-semibold mt-1">{provideGuestIdError}</p>
            )}
          </div>
          <button
            onClick={handleSaveProvideGuestId}
            className="w-full bg-green-400 text-white font-semibold text-sm py-2 rounded-md cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>}
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
          <div>
            <div className="flex justify-between items-center">
              <h1 className="font-bold">
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
            {!fromHome && 
            <div className="opacity-50 text-xs mt-1">
              <span className="flex gap-x-1">
                <h2>Already a part of this project? </h2>
                <button onClick={() => setGuestIdModal(true)} className="hover:underline">Provide your Guest ID</button>
                <h2>to link account</h2>
              </span>
            </div>
            }
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
    </>
  );
};

export default UserNameModal;
