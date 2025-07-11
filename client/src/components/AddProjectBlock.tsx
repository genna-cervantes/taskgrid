import { useState } from "react";
import AddProjectForm from "./AddProjectForm";

const AddProjectBlock = () => {

    const [addProjectForm, setAddProjectForm] = useState(false)

  return (
    <>
    {addProjectForm && <AddProjectForm setAddProjectForm={setAddProjectForm} />}
    <div onClick={() => setAddProjectForm(true)} className="dark:border-backgroundDark hover:border-lmLightBackground border-lmMidBackground border-2 rounded-md h-28 px-4 py-4 flex cursor-pointer relative font-bold dark:text-backgroundDark hover:text-lmLightBackground text-lmMidBackground justify-center items-center dark:hover:border-fadedWhite border-fadedBlack dark:hover:text-fadedWhite text-fadedBlack gap-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-plus-icon lucide-circle-plus"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
      <h1>Add Project</h1>
    </div>
    </>
  );
};

export default AddProjectBlock;
