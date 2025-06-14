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
  const userContext = useGuestId()

  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [guestIdModal, setGuestIdModal] = useState(false);
  const [provideGuestId, setProvideGuestId] = useState("");
  const [provideGuestIdError, setProvideGuestIdError] = useState("");
  
  const setUsername = trpc.setUsername.useMutation({
    onSuccess: (data) => {
      console.log("Name set:", data);
      setUsernameModal(false);
      utils.getUsername.invalidate({ id: projectId, guestId: userContext.guestId ?? "" });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });
  
  const insertUserProjectLink = trpc.insertUserProjectLink.useMutation({
    onSuccess: (data) => {
      setUsernameModal(false);
      utils.getUsername.invalidate({ id: projectId, guestId: userContext.guestId ?? "" });
      console.log("User project link set:", data);
    },
    onError: (error) => {
      console.error("Failed to create user project link:", error.message);
    },
  });
  
  const { data: users } = trpc.getUsersInProject.useQuery({
    id: projectId,
  });

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
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
    
    if (users?.some((u) => u?.username === name)) {
      setError("This name has already been registed to this board!");
      return;
    }
    
    // update
    if (userContext.guestId == null){
      setError("Guest Id is required!");
      return;
    }
    
    setIsLoading(true)
    
    if (users?.some((u) => u.guestId === userContext.guestId)) {
      setUsername.mutate({id: projectId, username: name, guestId: userContext.guestId})
      setIsLoading(false)
      setUsernameModal(false);
      return;
    }
    
    // insert
    insertUserProjectLink.mutate({id: projectId, username: name, guestId: userContext.guestId})

    await sleep(5000);
    setIsLoading(false)
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
    
    localStorage.setItem("guestId", provideGuestId)
    setUsernameModal(false);
    setGuestIdModal(false);
    utils.getUsername.invalidate({ id: projectId, guestId: userContext.guestId ?? "" });
  }
  
  if (userContext.isLoading && userContext.guestId == null && !userContext.guestId){
    return <>
      Loading Guest ID...
    </>
  }
  
  return (
    <>
      {/* provide guest id modal */}
      {guestIdModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div
          className="dark:bg-light bg-lmLightBackground rounded-lg shadow-xl p-8 w-[90%] md:w-full max-w-xl flex flex-col gap-y-4"
          onClick={(e) => e.stopPropagation()} // Prevent close on modal click
        >
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-sm md:text-base">
              Please provide your Guest ID:
            </h1>
            <button
              onClick={() => setGuestIdModal(false)}
              className="px-4 py-1 text-white text-xs md:text-sm font-semibold rounded-md bg-faintWhite cursor-pointer"
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
              className="w-full text-sm md:text-base"
            />
            {provideGuestIdError && (
              <p className="text-red-400 text-xxs md:text-xs font-semibold mt-1">{provideGuestIdError}</p>
            )}
          </div>
          <button
            onClick={handleSaveProvideGuestId}
            className="w-full bg-green-400 text-white text-xs md:text-sm font-semibold py-2 rounded-md cursor-pointer"
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
          className="dark:bg-light bg-lmLightBackground rounded-lg shadow-xl p-6 w-[90%] md:w-full max-w-xl flex flex-col gap-y-4"
          onClick={(e) => e.stopPropagation()} // Prevent close on modal click
        >
          <div>
            <div className="flex justify-between items-center">
              <h1 className="font-bold text-sm md:text-base">
                What name should others in this project call you?
              </h1>
              {fromHome && (
                <button
                onClick={() => setUsernameModal(false)}
                className="px-4 py-1 text-white text-sm font-semibold rounded-md bg-faintWhite cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
            {!fromHome && 
            <div className="opacity-50 text-xxs md:text-xs mt-1">
              <span className="flex gap-x-1 items-center flex-wrap text-sm">
              <span>Already a part of this project?</span>
              <button onClick={() => setGuestIdModal(true)} className="hover:underline">
                Provide your Guest ID
              </button>
              <span>to link account</span>
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
              className="w-full text-sm md:text-base"
            />
            {error && (
              <p className="text-red-400 text-xs font-semibold mt-1">{error}</p>
            )}
          </div>
          <button
            onClick={handleSaveName}
            className="w-full bg-green-400 text-white text-sm md:text-base font-semibold py-2 flex justify-center items-center rounded-md cursor-pointer disabled:cursor-not-allowed"
            disabled={insertUserProjectLink.isLoading || setUsername.isLoading}
          >
            {!isLoading ? (
                "Save"
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
    </>
  );
};

export default UserNameModal;
