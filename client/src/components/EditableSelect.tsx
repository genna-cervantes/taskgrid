import { useState, useRef, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Trash2, Pen, ChevronDown } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { pickRandomColor } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function EditableDropdown({
  isPage,
  taskCategory,
  setTaskCategory,
  taskCategoryOptions,
  setTaskCategoryOptions,
  projectId,
}: {
  isPage: boolean;
  taskCategory: string | undefined;
  setTaskCategory: React.Dispatch<React.SetStateAction<string | undefined>>;
  taskCategoryOptions: {
    color: string;
    category: string;
  }[];
  setTaskCategoryOptions: React.Dispatch<
    React.SetStateAction<
      {
        color: string;
        category: string;
      }[]
    >
  >;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newOption, setNewOption] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const utils = trpc.useUtils();

  const updateTaskCategoryOptions =
    trpc.tasks.updateTaskCategoryOptions.useMutation({
      onSuccess: () => {
        utils.tasks.getTaskCategoryOptions.invalidate({ projectId });
      },
      onError: (error) => {
        console.error("Failed to create task:", error.message);
      },
    });

  useEffect(() => {
    if (editingCategory) {
      inputRefs.current[editingCategory]?.focus();
    }
  }, [editingCategory]);

  const handleEdit = (id: string) => {
    setEditingCategory(id);
  };

  const handleDelete = (id: string) => {
    const newOptions = taskCategoryOptions.filter((o) => o.category !== id);
    setTaskCategoryOptions(newOptions);
      updateTaskCategoryOptions.mutate({
      projectId,
      taskCategoryOptions: newOptions
    });

    if (taskCategory === id) setTaskCategory(undefined); // if deleted ung currently selected
  };

  const handleChange = (color: string, value: string) => {
    const newOptions = taskCategoryOptions.map((o) => 
      o.color === color ? { ...o, category: value } : o
    );
    setTaskCategoryOptions(newOptions);
    
    updateTaskCategoryOptions.mutate({
      projectId,
      taskCategoryOptions: newOptions
    });
  };

  const handleAdd = () => {
    if (taskCategoryOptions.some((c) => c.category === newOption)) return;
    if (newOption === "") return;
    if (taskCategoryOptions.length >= 10) return;

    const randomColor = pickRandomColor(taskCategoryOptions);

    const newCategoryOptions = [...taskCategoryOptions, { category: newOption, color: randomColor },]
    setTaskCategoryOptions(newCategoryOptions);
    updateTaskCategoryOptions.mutate({ projectId, taskCategoryOptions: newCategoryOptions });

    setNewOption("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={`
            text-sm border-none py-1 w-full flex justify-between bg-transparent px-0 focus:outline-none focus:ring-0 focus:border-transparent hover:bg-transparent ${
            taskCategoryOptions.find((o) => o.category === taskCategory)
              ? "text-white"
              : "text-faintWhite"
          }`}
        >
          <span className="flex w-full items-center gap-x-4 text-white/90">
            <span
              className={`h-3 w-3 rounded-full bg-${
                taskCategoryOptions.find((o) => o.category === taskCategory)
                  ?.color ?? "gray"
              }-300`}
            ></span>
            {taskCategory
              ? taskCategoryOptions.find((o) => o.category === taskCategory)
                  ?.category
              : "Select option"}
          </span>
          <ChevronDown className="text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={`px-2 py-2 w-[var(--radix-popover-trigger-width)] ${
          isPage ? "dark:bg-backgroundDark" : "dark:bg-[#1A1A1A]"
        } font-jetbrains text-xs focus:outline-none focus:ring-0 focus:border-transparent border-none`}
      >
        <div className="flex flex-col gap-y-2 super-thin-scrollbar max-h-60 overflow-y-auto w-full">
          {taskCategoryOptions.map((opt) => (
            <div
              key={opt.category}
              className="flex items-center gap-x-2 w-full"
            >
              {editingCategory === opt.category ? (
                <div className="flex w-full items-center gap-x-4 hover:bg-faintWhite/10 rounded-sm px-1">
                  <span
                    className={`h-3 w-3 rounded-full bg-${opt.color}-300`}
                  ></span>
                  <Input
                    ref={(el) => {
                      inputRefs.current[opt.category] = el;
                    }}
                    value={opt.category}
                    onChange={(e) => handleChange(opt.color, e.target.value)}
                    onBlur={() => setEditingCategory(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingCategory(null);
                    }}
                    className={`px-0 py-2 !text-xs`}
                  />
                </div>
              ) : (
                <div className="flex w-full items-center gap-x-4 hover:bg-faintWhite/10 rounded-sm px-1 py-2 hover:cursor-pointer">
                  <span
                    className={`h-3 w-3 rounded-full bg-${opt.color}-300`}
                  ></span>
                  <button
                    className={`text-left w-full text-xs `}
                    onClick={() => {
                      setTaskCategory(opt.category);
                      setOpen(false);
                    }}
                  >
                    {opt.category}
                  </button>
                </div>
              )}

              <Pen
                className={`w-5 h-5 cursor-pointer hover:text-fadedWhite ${
                  editingCategory === opt.category
                    ? "text-fadedWhite"
                    : "text-faintWhite"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(opt.category);
                }}
              />
              <Trash2
                className="w-5 h-5 cursor-pointer text-faintWhite hover:text-fadedWhite"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(opt.category);
                }}
              />
            </div>
          ))}

          <div className="flex gap-x-2 items-center">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="New option"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              className={`!text-xs py-2 placeholder:text-midWhite bg-faintWhite/10 px-2 text-white focus:outline-none focus:ring-0 focus:border-transparent border-none`}
            />
            <button
              disabled={
                newOption.length < 1 || taskCategoryOptions.length >= 10
              }
              className={`px-3 rounded-md py-2 focus:outline-none focus:ring-0 focus:border-transparent focus:bg-midWhite focus:text-fadedWhite border-none bg-faintWhite disabled:bg-faintWhite ${
                newOption.length < 1
                  ? "hover:bg-faintWhite cursor-not-allowed"
                  : "hover:bg-midWhite hover:text-fadedWhite"
              } disabled:cursor-not-allowed  text-midWhite`}
              onClick={handleAdd}
            >
              Add
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
