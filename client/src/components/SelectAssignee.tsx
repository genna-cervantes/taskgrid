import React from "react";
import { UseFormSetValue } from "react-hook-form";
import { TaskFormData } from "./AddTaskForm";

const SelectAssignee = ({
  setTaskAssignedTo,
  setValue,
  taskAssignedTo,
  username,
  usersInProject,
}: {
  setTaskAssignedTo: React.Dispatch<React.SetStateAction<string[]>>;
  setValue?: UseFormSetValue<TaskFormData>;
  taskAssignedTo: string[];
  username: string;
  usersInProject: string[];
}) => {
  const handleUserToggle = (user: string) => {
    const updatedAssignees = taskAssignedTo.includes(user)
      ? taskAssignedTo.filter((pu) => pu !== user)
      : [...taskAssignedTo, user];

    // Update local state
    setTaskAssignedTo(updatedAssignees);

    // Update react-hook-form
    if (setValue) {
      setValue("assignedTo", updatedAssignees, { shouldValidate: true });
    }
  };

  return (
    <div
      className={`flex flex-col mt-1 ${
        usersInProject.length > 4 ? "max-h-20 overflow-y-auto scrollbar-none" : ""
      }`}
      role="group"
      aria-label="Assign users"
    >
      {usersInProject.map((u) => {
        const isChecked = taskAssignedTo.includes(u);
        return (
          <label
            key={u}
            className="inline-flex items-center space-x-2 cursor-pointer rounded px-2 py-1 hover:bg-faintWhite focus-within:bg-faintWhite"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleUserToggle(u);
              }
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleUserToggle(u)}
              className="sr-only peer"
            />
            <div
              className={`w-4 h-4 rounded border border-gray-400 flex items-center justify-center ${
                isChecked ? "bg-lmMidBackground border-lmMidBackground" : ""
              }`}
            >
              {isChecked && (
                <svg
                  className="w-3 h-3 "
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                ></svg>
              )}
            </div>
            <span className={`text-sm ${isChecked ? "" : "text-midWhite"}`}>
              {u} {u === username && "(You)"}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default SelectAssignee;
