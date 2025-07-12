import { useState, useRef, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Trash2, Pen, ChevronDown } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function EditableDropdown({isPage}: {isPage: boolean}) {
  const [options, setOptions] = useState([
    { id: "1", label: "Design" },
    { id: "2", label: "Development" },
  ]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (editingId) {
      inputRefs.current[editingId]?.focus();
    }
  }, [editingId]);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleDelete = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
    if (selected === id) setSelected(null);
  };

  const handleChange = (id: string, value: string) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, label: value } : o))
    );
  };

  const handleAdd = () => {
    if (!newOption.trim()) return;
    const newId = Date.now().toString();
    setOptions((prev) => [...prev, { id: newId, label: newOption }]);
    setNewOption("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className={`${isPage ? "text-base" : "text-sm"} border-none shadow-bottom-grey w-full flex justify-between bg-transparent px-0 focus:outline-none focus:ring-0 focus:border-transparent hover:bg-transparent ${options.find((o) => o.id === selected) ? 'text-white' : 'text-faintWhite' }`}>
          {selected
            ? options.find((o) => o.id === selected)?.label
            : "Select option"}
          <ChevronDown className="text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="px-2 py-2 w-[var(--radix-popover-trigger-width)] dark:bg-backgroundDark font-jetbrains text-xs focus:outline-none focus:ring-0 focus:border-transparent border-none">
        <div className="flex flex-col gap-y-2 max-h-60 overflow-y-auto w-full">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-x-2 w-full">
              {editingId === opt.id ? (
                <Input
                  ref={(el) => (inputRefs.current[opt.id] = el)}
                  value={opt.label}
                  onChange={(e) => handleChange(opt.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingId(null);
                  }}
                  className={`px-1 !text-fadedWhite text-xs`}
                />
              ) : (
                <button
                  className={`text-left w-full py-2 px-1 rounded-sm text-xs hover:bg-faintWhite/10`}
                  onClick={() => setSelected(opt.id)}
                >
                  {opt.label}
                </button>
              )}
              
                <Pen
                  className={`w-5 h-5 cursor-pointer hover:text-fadedWhite ${editingId === opt.id ? 'text-fadedWhite' : 'text-faintWhite'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(opt.id);
                  }}
                />
                <Trash2
                  className="w-5 h-5 cursor-pointer text-faintWhite hover:text-fadedWhite"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(opt.id);
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
              className={`text-xs py-2 placeholder:text-midWhite bg-faintWhite/10 px-2 text-white !focus:outline-none !focus:ring-0 !focus:border-transparent border-none`}
              
            />
            <Button size="sm" className="bg-faintWhite hover:bg-midWhite text-midWhite hover:text-fadedWhite" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
