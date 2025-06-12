import React, { useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { TaskFormData } from "./AddTaskForm";

const SelectAssignee = ({
  setTaskAssignedTo,
  setValue,
  taskAssignedTo,
  username,
  usersInProject
}: {
  setTaskAssignedTo: React.Dispatch<React.SetStateAction<string[]>>;
  setValue?: UseFormSetValue<TaskFormData>;
  taskAssignedTo: string[];
  username: string;
  usersInProject: string[];
}) => {
  const [showDropdown, setShowDropdown] = useState(true);

  const handleUserToggle = (user: string) => {
    const updatedAssignees = taskAssignedTo.includes(user)
      ? taskAssignedTo.filter((pu) => pu !== user)
      : [...taskAssignedTo, user];

    // Update local state
    setTaskAssignedTo(updatedAssignees);

    // Update react-hook-form
    if (setValue){
        setValue("assignedTo", updatedAssignees, { shouldValidate: true });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex justify-between items-center text-base w-full"
      >
        <label htmlFor="assignTo" className="font-semibold">
          Assign To:
        </label>
        {showDropdown ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chevron-up text-white/90"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chevron-down text-white/90"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>
      {showDropdown && (
        <div className="flex flex-col mt-2" role="group" aria-label="Assign users">
          {usersInProject.map((u) => {
            const isChecked = taskAssignedTo.includes(u);
            return (
              <label
                key={u}
                className="inline-flex items-center space-x-2 cursor-pointer rounded px-2 py-1 hover:bg-white/5 focus-within:bg-white/10"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
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
                    isChecked ? "bg-white/40 border-white/40" : ""
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                    </svg>
                  )}
                </div>
                <span className="text-sm">
                  {u} {u === username && "(You)"}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </>
  );
};

export default SelectAssignee;