import React, { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { Pen, PlusIcon, Trash2 } from "lucide-react";
import { EditableDropdown } from "./EditableSelect";

const TaskSelectCategory = ({
  taskCategory,
  setTaskCategory,
  taskCategoryOptions,
}: {
  taskCategory: string | undefined;
  setTaskCategory: React.Dispatch<React.SetStateAction<string | undefined>>;
  taskCategoryOptions: { color: string; category: string }[];
}) => {
  const lastUpdatedRef = useRef<null | string>(null);
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const colors = taskCategoryOptions.map((o) => o.color);
  const [categories, setCategories] = useState(
    taskCategoryOptions.map((o) => ({ id: o.category, category: o.category }))
  ); // should change id
  const [categoryColor, setCategoryColor] = useState("gray");
  const [currentEditCategory, setCurrentEditCategory] = useState("");

  useEffect(() => {
    if (lastUpdatedRef.current === "color") return;
    const color =
      taskCategoryOptions.find((tc) => tc.category === taskCategory)?.color ??
      "gray";
    if (color !== categoryColor) setCategoryColor(color);
  }, [taskCategory]);

  useEffect(() => {
    if (lastUpdatedRef.current === "category") return;
    const category =
      taskCategoryOptions.find((tc) => tc.color === categoryColor)?.category ??
      "";

    if (category !== taskCategory) setTaskCategory(category);
  }, [categoryColor]);

  // edit task category options
  const handleAddCategory = () => {
    setCategories((prev) => [
      ...prev,
      { category: "New Category", id: Math.random().toString() },
    ]);
  };

  const handleEditCategory = (id: string) => {
    setCurrentEditCategory(id);

    inputRef.current?.focus();
    
  };

  return (
    <div className="w-full ">
      <h3
        className={`text-xxs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Category:
      </h3>
      <div className="flex gap-x-4">
        <Select
          onValueChange={(v) => {
            lastUpdatedRef.current = "color";
            setCategoryColor(v);
            setTimeout(() => {
              lastUpdatedRef.current = null;
            }, 0);
          }}
          value={categoryColor}
        >
          <SelectTrigger className="border-none w-fit bg-light px-0 focus:outline-none focus:ring-0 focus:border-transparent">
            {/* <SelectValue placeholder="" className="text-white" /> */}
            <div className="flex ">
              <span
                className={`h-3 w-3 rounded-full bg-${categoryColor}-400 mr-3`}
              />
            </div>
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)] dark:bg-backgroundDark focus:outline-none focus:ring-0 focus:border-transparent">
            <SelectGroup className="w-full">
              {colors.map((c) => (
                <SelectItem
                  key={c}
                  value={c}
                  className="py-2 w-8 hover:cursor-pointer flex"
                >
                  <div className="flex">
                    <span className={`h-3 w-3 rounded-full bg-${c}-400 mr-3`} />
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(v) => {
            lastUpdatedRef.current = "category";
            setTaskCategory(v);
          }}
          value={taskCategory}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger
            className={`w-full border-none bg-light px-0 focus:outline-none focus:ring-0 focus:border-transparent ${taskCategory === "" ? "!text-faintWhite" : ""}`}
          >
            {taskCategory === "" ? "Select a category" : taskCategory}
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)] dark:bg-backgroundDark focus:outline-none focus:ring-0 focus:border-transparent">
            <SelectGroup className="w-full">
              {categories.map((c) => (
                <div className="flex items-center">
                <SelectItem
                  key={c.id}
                  value={c.category}
                  className="hover:cursor-pointer w-full relative"
                >
                  <div className="flex justify-between items-center w-full py-1">
                    <span className="flex gap-x-2 items-center">
                      <input
                        ref={inputRef}
                        className="w-full cursor-pointer"
                        type="text"
                        disabled={currentEditCategory !== c.id}
                        value={c.category}
                        onChange={(e) => {
                          e.stopPropagation()
                          const updated = categories.map((cat) =>
                            cat.id === c.id ? { ...cat, category: e.target.value } : cat
                          );
                          setCategories(updated);
                        }}
                      />
                    </span>
                  </div>
                </SelectItem>
                    {isOpen && (
                      <span className={`flex items-center absolute right-2`}>
                        <Pen
                          onClick={() => handleEditCategory(c.id)}
                          className="bg-white h-4 z-[9999] cursor-pointer hover:text-white text-midWhite"
                        />
                        <Trash2 className="h-4" />
                      </span>
                    )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-2 mt-2 flex gap-x-1 items-center font-jetbrains text-xs hover:bg-faintWhite w-full rounded-md py-2"
              >
                Add Category <PlusIcon className="h-3" />{" "}
              </button>
            </SelectGroup>
          </SelectContent>
        </Select>
        <EditableDropdown />
      </div>
    </div>
  );
};

export default TaskSelectCategory;
