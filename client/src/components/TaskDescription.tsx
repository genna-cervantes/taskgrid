import React from "react";

const TaskDescription = ({taskDescription, setTaskDescription, isPage = false}: {isPage?: boolean, taskDescription: string|undefined, setTaskDescription: React.Dispatch<React.SetStateAction<string | undefined>>}) => {
  return (
    <div>
      <h3
        className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Description:
      </h3>
      <textarea
        placeholder="What's this about?"
        className={`w-full ${isPage ? "text-base" : "text-sm"} ${isPage ? "h-24" : "h-16"} text-white/90 placeholder:text-faintWhite shadow-bottom-grey focus:outline-none focus:ring-0 focus:border-transparent`}
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
      />
    </div>
  );
};

export default TaskDescription;
