import React from "react";

const AddProjectForm = ({setAddProjectForm}: {setAddProjectForm: React.Dispatch<React.SetStateAction<boolean>>}) => {

    // get name
    // generate uuid
    // add to indexedb
    // add to postgres db

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => setAddProjectForm(false)} // Close when clicking backdrop
    >
      <div
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      ></div>
    </div>
  );
};

export default AddProjectForm;
