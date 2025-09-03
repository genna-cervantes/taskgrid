import React from "react";
import QuillEditor from "./QuillEditor";

const TaskDescription = ({taskDescription, setTaskDescription, error, isPage = false}: {isPage?: boolean, error: string|undefined, taskDescription: string|undefined, setTaskDescription: React.Dispatch<React.SetStateAction<string | undefined>>}) => {
  return (
    <div className="">
      <h3
        className={`${isPage ? "hidden" : "text-xxs"} text-midWhite !font-rubik tracking-wider mb-1 transition-all duration-100 `}
      >
        Description:
      </h3>
      {/* <textarea
        placeholder="What's this about?"
        className={`w-full ${isPage ? "text-base" : "text-sm"} ${isPage ? "h-24" : "h-16"} text-white/90 placeholder:text-faintWhite shadow-bottom-grey focus:outline-none focus:ring-0 focus:border-transparent`}
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
      /> */}
      <QuillEditor description={taskDescription} setDescription={setTaskDescription} />
      {error && <p className="text-xs pb-2 text-red-400 !font-rubik text-start line-clamp-1">{error}</p>}
    </div>
  );
};

export default TaskDescription;
