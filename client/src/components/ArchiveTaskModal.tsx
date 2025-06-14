import React, { useContext } from "react";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import { ActionContext } from "../contexts/ActionContext";
import { trpc } from "../utils/trpc";
import { Task } from "../../../server/src/shared/types";

const ArchiveTaskModal = ({
  archiveModal,
  setArchiveModal,
  column,
  projectId,
  tasks,
}: {
  archiveModal: boolean;
  setArchiveModal: React.Dispatch<React.SetStateAction<boolean>>;
  column: string;
  projectId: string;
  tasks: Task[];
}) => {
  const utils = trpc.useUtils();

  const recentTaskContext = useContext(RecentTaskContext);
  const actionContext = useContext(ActionContext);

  const archiveTasksByColumn = trpc.archiveTaskByColumn.useMutation({
    onSuccess: (data) => {
      console.log("Task deleted:", data);
      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const handleClearTask = () => {
    recentTaskContext?.setTasks([...tasks]); // keep track of this task for insertion later if undone

    archiveTasksByColumn.mutate({ id: projectId, column });
    setArchiveModal(false);

    actionContext?.setAction("archived");
  };

  if (archiveModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={
          (e) =>{
            if (archiveTasksByColumn.isLoading) {
              e.stopPropagation();
            } else {
              setArchiveModal(false)
            }
          }
        } // Close when clicking backdrop
      >
        <div
          className="dark:bg-light bg-lmLightBackground rounded-lg shadow-xl p-4 md:p-6 w-[90%] md:w-full md:max-w-xl flex flex-col gap-y-4"
          onClick={(e) => e.stopPropagation()} // Prevent close on modal click
        >
          <h2 className="text-sm md:text-base">
            Are you sure you want to archive{" "}
            <span className="font-semibold">all</span> tasks in{" "}
            <span className="font-semibold">{column}</span>?
          </h2>
          <div className="flex flex-col gap-y-2">
            <button
              onClick={handleClearTask}
              className="bg-red-400 w-full text-white text-xs md:text-sm font-semibold py-2 rounded-md cursor-pointer disabled:cursor-not-allowed"
              disabled={archiveTasksByColumn.isLoading}
            >
              {!archiveTasksByColumn.isLoading ? (
                "Yes"
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
            <button
              onClick={() => setArchiveModal(false)}
              className="bg-faintWhite w-full text-white text-xs md:text-sm font-semibold py-2 rounded-md cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <></>;
};

export default ArchiveTaskModal;
