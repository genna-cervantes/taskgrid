import { useState } from "react";
import { cn } from "../utils/utils";
import ArchiveTaskModal from "./ArchiveTaskModal";
import { Task } from "../../../server/src/shared/types";

const ClearTask = ({
    tasks,
  projectId,
  col,
  className = "",
}: {
    tasks: Task[];
  projectId: string;
  col: string;
  className: string;
}) => {

  const [archiveModal, setArchiveModal] = useState(false);

  const handleClickClearTask = () => {
    setArchiveModal(true);
  };

  return (
    <>
      <ArchiveTaskModal
        archiveModal={archiveModal}
        setArchiveModal={setArchiveModal}
        column={col}
        projectId={projectId}
        tasks={tasks}
      />
      <button onClick={handleClickClearTask}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            className,
            "lucide lucide-archive-x-icon lucide-archive-x text-[#464646] hover:text-white/70"
          )}
        >
          <rect width="20" height="5" x="2" y="3" rx="1" />
          <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
          <path d="m9.5 17 5-5" />
          <path d="m9.5 12 5 5" />
        </svg>
      </button>
    </>
  );
};

export default ClearTask;
