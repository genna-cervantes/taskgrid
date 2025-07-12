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
  isPage=false
}: {
  isPage?: boolean;
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
        className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Category:
      </h3>
      <div className="flex gap-x-6 w-full">
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
          <SelectTrigger className={`${isPage ? "text-base" : "text-sm"} border-none w-fit bg-transparent px-0 focus:outline-none focus:ring-0 focus:border-transparent`}>
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
        <EditableDropdown isPage={isPage} />
      </div>
    </div>
  );
};

export default TaskSelectCategory;
