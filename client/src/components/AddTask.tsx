import { useState } from "react";
import { cn } from "../utils/utils";
import { ColumnKey } from "../../../server/src/shared/types";
import AddTaskForm from "./AddTaskForm";

const AddTask = ({username, projectId, col, className = ""}: {username: string|undefined, projectId: string, col: ColumnKey, className?: string}) => {
  const [addModal, setAddModal] = useState(false);

  if (addModal){
    return <AddTaskForm username={username} projectId={projectId} col={col} setAddModal={setAddModal} />
  }

  return (
    <button onClick={() => setAddModal(true)} className={cn("border-2 border-[#464646] text-xs text-[#464646] text-center rounded-md w-full py-2 font-bold cursor-pointer hover:text-white/70 hover:border-white/70", className)}>
      Add Task
    </button>
  );
};

export default AddTask;
