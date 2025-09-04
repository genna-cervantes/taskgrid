import React, { useState, useEffect, useRef } from "react";

const TaskTitle = ({
  taskTitle,
  setTaskTitle,
  isPage = false,
  error
}: {
  isPage?: boolean;
  taskTitle: string|undefined;
  setTaskTitle: React.Dispatch<React.SetStateAction<string|undefined>>;
  error: string|undefined
}) => {
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editedTaskTitle, setEditedTaskTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize edited title when taskTitle changes
  useEffect(() => {
    setEditedTaskTitle(taskTitle || "");
  }, [taskTitle]);

  // Edit handlers
  const handleEditTaskTitle = () => {
    setEditedTaskTitle(taskTitle || "");
    setEditMode(true);
  };

  const handleSaveTaskTitle = () => {
    setTaskTitle(editedTaskTitle);
    setEditMode(false);
  };

  const handleCancelTaskTitle = () => {
    setEditedTaskTitle(taskTitle || "");
    setEditMode(false);
  };

  const handleKeyDownTaskTitle = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTaskTitle();
    } else if (e.key === "Escape") {
      handleCancelTaskTitle();
    }
  };

  // Focus input when edit mode is enabled
  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editMode]);

  return (
    <div>
      <h3
        className={`${isPage ? "hidden" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Title:
      </h3>
      {editMode ? (
        <input
          ref={inputRef}
          type="text"
          className={`w-full ${isPage ? "text-lg" : "text-sm"} text-white/90 placeholder:text-faintWhite bg-transparent outline-none transition-colors`}
          value={editedTaskTitle}
          onChange={(e) => setEditedTaskTitle(e.target.value)}
          onBlur={handleSaveTaskTitle}
          onKeyDown={handleKeyDownTaskTitle}
          placeholder="What's this about?"
        />
      ) : (
        <div
          className={`w-full ${isPage ? "text-lg" : "text-sm"} ${!taskTitle? 'text-faintWhite' : 'text-white/90'} cursor-pointer transition-colors flex items-center`}
          onClick={handleEditTaskTitle}
        >
          {taskTitle || "What's this about?"}
        </div>
      )}
      {error && <p className="text-xs pb-2 text-red-400 !font-rubik text-start line-clamp-1">{error}</p>}
    </div>
  );
};

export default TaskTitle;
