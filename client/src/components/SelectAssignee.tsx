import React, { useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { type TaskAdd } from "./AddTaskForm";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { cn } from "@/lib/utils";

const SelectAssignee = ({
  isPage=false,
  setTaskAssignedTo,
  setValue,
  taskAssignedTo,
  username,
  usersInProject,
}: {
  isPage?: boolean
  setTaskAssignedTo: React.Dispatch<React.SetStateAction<string[]>>;
  setValue?: UseFormSetValue<TaskAdd>;
  taskAssignedTo: string[];
  username: string;
  usersInProject: string[];
}) => {

  const [open, setOpen] = useState(false);

  const handleToggle = (u: string) => {
    const updated =
      taskAssignedTo.includes(u)
        ? taskAssignedTo.filter((tau) => tau !== u)
        : [...taskAssignedTo, u];

    setTaskAssignedTo(updated);
    if (setValue) {
      setValue("assignTo", updated, { shouldValidate: true });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full border-none bg-transparent shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] px-0 placeholder:text-faintWhite justify-between hover:bg-transparent"
        >
          <span
            className={cn(
              isPage ? "text-base" : "text-sm",
              taskAssignedTo.length === 0 ? "text-faintWhite" : "text-white/90"
            )}
          >
            {taskAssignedTo.length === 0
              ? "Select Assignee"
              : taskAssignedTo.join(", ")}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className={`px-2 flex flex-col gap-y-1 py-2 w-[var(--radix-popover-trigger-width)] ${isPage ? "dark:bg-backgroundDark" : "dark:bg-[#1A1A1A]"} font-jetbrains text-xs focus:outline-none focus:ring-0 focus:border-transparent border-none`}>
        {usersInProject.map((u) => {
          const isSelected = taskAssignedTo.includes(u);
          return (
            <div
              key={u}
              onClick={() => handleToggle(u)}
              className={cn(
                "flex items-center px-1 py-2 cursor-pointer rounded-md hover:bg-faintWhite transition-colors duration-200",
                isSelected && "bg-faintWhite-700 text-white"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(u)}
                className="mr-2 border-midWhite"
              />
              <span className='text-xs'>
                {u} {u === username && "(You)"}
              </span>
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  )
};

export default SelectAssignee;
