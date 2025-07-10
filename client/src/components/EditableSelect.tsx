import { useState, useRef, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Trash2, Pen } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function EditableDropdown() {
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
        <Button variant="outline" className="w-[200px] justify-start">
          {selected
            ? options.find((o) => o.id === selected)?.label
            : "Select option"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px]">
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              {editingId === opt.id ? (
                <Input
                  ref={(el) => (inputRefs.current[opt.id] = el)}
                  value={opt.label}
                  onChange={(e) => handleChange(opt.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingId(null);
                  }}
                />
              ) : (
                <button
                  className="text-left w-full"
                  onClick={() => setSelected(opt.id)}
                >
                  {opt.label}
                </button>
              )}
              <Pen
                className="w-4 h-4 cursor-pointer text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(opt.id);
                }}
              />
              <Trash2
                className="w-4 h-4 cursor-pointer text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(opt.id);
                }}
              />
            </div>
          ))}

          <div className="flex gap-2 items-center">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="New option"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button size="sm" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
