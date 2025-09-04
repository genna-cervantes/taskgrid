import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { cn } from "@/lib/utils";

type Option = {
  id: string;
  title: string;
};

const MultiSelect = ({
  isPage = false,
  isSidebar = false,
  setValue,
  value,
  choices,
  placeholder
}: {
  isPage?: boolean;
  isSidebar ?: boolean;
  setValue: React.Dispatch<React.SetStateAction<Option[]>>;
  value: Option[];
  choices: Option[];
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);

  const handleToggle = (option: Option) => {
    const isSelected = value.some((v) => v.id === option.id);
    const updated = isSelected
      ? value.filter((v) => v.id !== option.id)
      : [...value, option];

    setValue(updated);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full py-1 border-none truncate bg-transparent px-0 placeholder:text-faintWhite justify-between hover:bg-transparent"
        >
          <span
            className={cn(
              isSidebar ? "text-xs" : "text-sm",
              value.length === 0 ? "text-faintWhite" : "text-white/90"
            )}
          >
            {value.length === 0
              ? placeholder
              : value.map((v) => v.title.length > 20 ? `${v.title.slice(0, 20)}...` : v.title).join(", ")}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={`px-2 flex flex-col gap-y-1 overflow-y-scroll max-h-40 super-thin-scrollbar py-2 w-[var(--radix-popover-trigger-width)] ${
          isPage ? "dark:bg-backgroundDark" : "dark:bg-[#1A1A1A]"
        } font-jetbrains text-xs focus:outline-none focus:ring-0 focus:border-transparent border-none`}
      >
        {choices.map((option) => {
          const isSelected = value.some((v) => v.id === option.id);
          return (
            <div
              key={option.id}
              onClick={() => handleToggle(option)}
              className={cn(
                "flex items-center px-1 py-2 cursor-pointer rounded-md hover:bg-faintWhite transition-colors duration-200",
                isSelected && "bg-faintWhite-700 text-white"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(option)}
                className="mr-2 border-midWhite"
              />
              <span className="text-xs">{option.title}</span>
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect;
