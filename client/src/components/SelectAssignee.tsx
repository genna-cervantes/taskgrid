import React, { useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { TaskFormData } from "./AddTaskForm";

const SelectAssignee = ({
  setTaskAssignedTo,
  setValue,
  taskAssignedTo,
  username,
  usersInProject,
  showModal
}: {
  setTaskAssignedTo: React.Dispatch<React.SetStateAction<string[]>>;
  setValue?: UseFormSetValue<TaskFormData>;
  taskAssignedTo: string[];
  username: string;
  usersInProject: string[];
  showModal?: boolean
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

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
      {(showDropdown || showModal) && (
        <div className="flex flex-col gap-y-1 mt-2">
          {usersInProject.map((u) => {
            const isChecked = taskAssignedTo.includes(u);
            return (
              <div
                key={u}
                className="inline-flex items-center space-x-2 cursor-pointer"
                onClick={() => handleUserToggle(u)}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // Controlled by parent div onClick
                  className="peer hidden"
                />
                <div
                  className={`w-4 h-4 rounded border border-gray-400 flex items-center justify-center ${
                    isChecked ? "bg-white/40 border-white/40" : ""
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">
                  {u} {u === username && "(You)"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default SelectAssignee;
