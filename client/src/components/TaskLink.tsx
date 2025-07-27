import React from "react";

const TaskLink = ({
  taskLink,
  setTaskLink,
  error,
  isPage = false,
}: {
  isPage?: boolean;
  taskLink: string | undefined;
  setTaskLink: React.Dispatch<React.SetStateAction<string | undefined>>;
  error: string|undefined;
}) => {
  return (
    <div>
      <h3
        className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Link:
      </h3>

      <input
        placeholder="https://"
        className={`w-full shadow-bottom-grey pb-2 text-white/90 placeholder:text-faintWhite ${isPage ? "text-base" : "text-sm"} focus:outline-none focus:ring-0 focus:border-transparent`}
        value={taskLink ?? ''}
        onChange={(e) => setTaskLink(e.target.value)}
      />

      {error && (
        <p className="text-xs pb-2 text-red-400 !font-rubik text-start line-clamp-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default TaskLink;
