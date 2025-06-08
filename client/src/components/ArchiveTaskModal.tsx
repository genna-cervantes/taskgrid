import React from "react";

const ArchiveTaskModal = ({
  archiveModal,
  setArchiveModal,
  column,
  handleClearTask,
}: {
  archiveModal: boolean;
  setArchiveModal: React.Dispatch<React.SetStateAction<boolean>>;
  column: string;
  handleClearTask: () => void;
}) => {
  if (archiveModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => setArchiveModal(false)} // Close when clicking backdrop
      >
        <div
          className="bg-[#464646] rounded-lg shadow-xl p-4 md:p-6 w-[90%] md:w-full md:max-w-xl flex flex-col gap-y-4"
          onClick={(e) => e.stopPropagation()} // Prevent close on modal click
        >
            <h2 className="text-sm md:text-base">
                Are you sure you want to archive <span className="font-semibold">all</span> tasks in <span className="font-semibold">{column}</span>?
            </h2>
            <div className="flex flex-col gap-y-2">
                <button onClick={handleClearTask} className="bg-red-400 w-full text-white text-xs md:text-sm font-semibold py-2 rounded-md cursor-pointer">
                    Yes
                </button>
                <button onClick={() => setArchiveModal(false)} className="bg-white/20 w-full text-white text-xs md:text-sm font-semibold py-2 rounded-md cursor-pointer">
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
