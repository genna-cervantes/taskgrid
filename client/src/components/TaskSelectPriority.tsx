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
                  : "bg-faintWhite dark:text-midWhite"
              } ${
                isPage ? "text-base" : "text-sm"
              }  dark:bg-faintWhite dark:hover:text-white text-fadedBlack flex-1 hover:bg-lmMidBackground dark:hover:bg-midWhite rounded-md py-1 cursor-pointer transition-colors`}
            >
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
