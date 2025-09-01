import React from "react";

const TaskSelectPriority = ({
  priorityLevels,
  taskPriority,
  setTaskPriority,
  error,
  isPage = false,
}: {
  isPage?: boolean;
  priorityLevels: readonly ["low", "medium", "high"];
  taskPriority: "low" | "medium" | "high" | undefined;
  error: string|undefined
  setTaskPriority:
    | React.Dispatch<React.SetStateAction<"low" | "medium" | "high">>
    | React.Dispatch<
        React.SetStateAction<"low" | "medium" | "high" | undefined>
      >;
}) => {
  return (
    <div>
      <h3
        className={`${
          isPage ? "text-xs" : "text-xxs"
        } text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Priority:
      </h3>
      <div className="flex w-full gap-x-2">
        <div className="flex w-full gap-x-2 mt-1">
          {priorityLevels.map((p) => (
            <button
              key={p}
              onClick={() => setTaskPriority(p)}
              type="button"
              className={`${
                taskPriority === p
                  ? "bg-lmMidBackground dark:bg-midWhite text-fadedBlack dark:text-white"
                  : "text-fadedWhite border border-faintWhite"
              } ${
                isPage ? "text-sm" : "text-xs"
              } flex items-center gap-x-2 justify-center text-fadedBlack flex-1 rounded-md py-1 cursor-pointer transition-colors`}
            >
              {p === 'high' && <div className="flex gap-x-[0.2rem]">
                <div className={`bg-red-400 h-2 w-[0.15rem]`} />
                <div className={`bg-red-400 h-2 w-[0.15rem]`} />
                <div className={`bg-red-400 h-2 w-[0.15rem]`} />
              </div>}
              {p === 'medium' && <div className="flex gap-x-[0.2rem]">
                <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
                <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
              </div>}
              {p === 'low' && <div className="flex gap-x-[0.2rem]">
                <div className={`bg-green-400 h-2 w-[0.15rem]`} />
              </div>}
              {p.slice(0, 1).toUpperCase()}
              {p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-xs pb-2 text-red-400 !font-rubik text-start line-clamp-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default TaskSelectPriority;
