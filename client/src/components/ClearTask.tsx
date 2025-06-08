import { useContext, useState } from "react";
import { trpc } from "../utils/trpc";
import { cn } from "../utils/utils";
import ArchiveTaskModal from "./ArchiveTaskModal";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import { ActionContext } from "../contexts/ActionContext";
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
    const recentTaskContext = useContext(RecentTaskContext)
    const actionContext = useContext(ActionContext)

  const [archiveModal, setArchiveModal] = useState(false);

  const utils = trpc.useUtils();

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

    archiveTasksByColumn.mutate({ id: projectId, column: col });
    setArchiveModal(false);

    actionContext?.setAction("archived");
  };

  const handleClickClearTask = () => {
    setArchiveModal(true);
  };

  return (
    <>
      <ArchiveTaskModal
        archiveModal={archiveModal}
        setArchiveModal={setArchiveModal}
        column={col}
        handleClearTask={handleClearTask}
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
