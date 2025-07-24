import React from "react";

const TaskTitle = ({
  taskTitle,
  setTaskTitle,
  isPage = false,
}: {
  isPage?: boolean;
  taskTitle: string|undefined;
  setTaskTitle: React.Dispatch<React.SetStateAction<string|undefined>>;
}) => {
  return (
    <div>
      <h3
        className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Title:
      </h3>
      <textarea
        placeholder="What's this about?"
        className={`w-full ${isPage ? "text-base" : "text-sm"} text-white/90 h-12 super-thin-scrollbar placeholder:text-faintWhite shadow-bottom-grey focus:outline-none focus:ring-0 focus:border-transparent`}
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
      />
    </div>
  );
};

export default TaskTitle;
