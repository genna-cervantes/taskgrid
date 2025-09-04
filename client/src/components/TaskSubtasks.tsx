import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical } from "lucide-react";

type Subtask = {
  title: string;
  isDone: boolean;
};

const TaskSubtasks = ({
  taskSubtasks,
  setTaskSubtasks,
  error,
  isPage = false,
}: {
  isPage?: boolean;
  taskSubtasks: Subtask[];
  error: string | undefined;
  setTaskSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>;
}) => {
  const handleTitleChange = (index: number, value: string) => {
    let updated = [...taskSubtasks];

    // If this is the "add new" input (beyond existing array)
    if (index >= taskSubtasks.length) {
      // Only add if there's actual content
      if (value.trim() !== "") {
        updated.push({ title: value, isDone: false });
      }
      setTaskSubtasks(updated);
      return;
    }

    // Remove if cleared and not the last one
    if (value.trim() === "") {
      updated.splice(index, 1);
      setTaskSubtasks(updated);
      return;
    }

    // Update existing subtask
    updated[index] = { ...updated[index], title: value };
    setTaskSubtasks(updated);
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    // Don't allow checking the "add new" input
    if (index >= taskSubtasks.length) {
      return;
    }

    const updated = [...taskSubtasks];
    updated[index].isDone = checked;
    setTaskSubtasks(updated);
  };

  const displaySubtasks = [...taskSubtasks, { title: "", isDone: false }];

  return (
    <div className="space-y-2">
      {/* <h3 className="text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100">
        Sub Tasks:
      </h3> */}
      <div className="flex flex-col gap-y-3">
        {displaySubtasks.map((s, index) => {
          const isNewInput = index >= taskSubtasks.length;
          
          return (
            <div key={index} className="flex items-center gap-x-2">
              <GripVertical className="h-[1.1rem] mx-[-5px] text-midWhite hover:cursor-grab" strokeWidth={2} />
              <Checkbox
                checked={s.isDone ?? false}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(index, checked === true)
                }
                className="bg-inherit h-5 w-5 border border-faintWhite"
                disabled={isNewInput} // Disable checkbox for the "add new" input
              />
              <input
                type="text"
                value={s.title}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                placeholder="Add Subtask"
                className="shadow-bottom-grey text-sm placeholder:text-faintWhite w-full bg-transparent text-white focus:outline-none focus:ring-0 focus:border-transparent"
              />
            </div>
          );
        })}
      </div>
      {error && (
        <p className="text-xxs pb-2 text-red-400 text-start line-clamp-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default TaskSubtasks