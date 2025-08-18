import { cn } from "../utils/utils";
import { ColumnKey } from "../../../server/src/shared/types";

const AddTask = ({type, username, projectId, col, setAddModal, className = ""}: {setAddModal: React.Dispatch<React.SetStateAction<string>>, type: string, username: string|undefined, projectId: string, col: ColumnKey, className?: string}) => {

  if (type === 'block'){
    return (
      <button onClick={() => setAddModal(col)} className={cn("border dark:hover:border-fadedWhite dark:hover:text-fadedWhite dark:border-light hover:border-lmLightBackground text-xs hover:text-lmLightBackground text-faintBlack dark:text-light text-center rounded-md w-full py-2 font-bold cursor-pointer border-faintBlack", className)}>
        Add
      </button>
    );
  }else{
    return (
      <button title="Add Task" onClick={() => setAddModal(col)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus hover:text-lmLightBackground dark:hover:border-fadedWhite dark:hover:text-fadedWhite dark:border-light text-faintBlack dark:text-light"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </button>
    )
  }
};

export default AddTask;
