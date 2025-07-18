import { Checkbox } from "@/components/ui/checkbox"; // Adjust path as needed

type Subtask = {
  title: string;
  isDone: boolean;
};

const TaskSubtasks = ({
  taskSubtasks,
  setTaskSubtasks,
  isPage = false,
}: {
  isPage?: boolean;
  taskSubtasks: Subtask[];
  setTaskSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>;
}) => {
  const handleTitleChange = (index: number, value: string) => {
    let updated = [...taskSubtasks];

    // Remove if cleared and not the last one
    if (value.trim() === "" && index !== taskSubtasks.length - 1) {
      updated.splice(index, 1);
      setTaskSubtasks(updated);
      return;
    }

    updated[index] = { ...updated[index], title: value };

    // Add a blank subtask only if editing the last one
    if (
      index === updated.length - 1 &&
      value.trim() !== "" &&
      !updated.some((t, i) => i !== index && t.title.trim() === "")
    ) {
      updated.push({ title: "", isDone: false });
    }

    setTaskSubtasks(updated);
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const updated = [...taskSubtasks];
    updated[index].isDone = checked;
    setTaskSubtasks(updated);
  };

  console.log("st1", taskSubtasks);

  return (
    <div className="space-y-2">
      <h3
        className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Sub Tasks:
      </h3>
      <div className="flex flex-col gap-y-3">
        {taskSubtasks.map((s, index) => (
          <div key={index} className="flex items-center gap-x-2">
            <Checkbox
              checked={s.isDone}
              onCheckedChange={(checked) =>
                handleCheckboxChange(index, checked === true)
              }
              className="bg-inherit h-5 w-5 border border-faintWhite"
            />
            <input
              type="text"
              value={s.title}
              onChange={(e) => handleTitleChange(index, e.target.value)}
              placeholder={`Add Subtask`}
              className="shadow-bottom-grey placeholder:text-faintWhite text-base w-full bg-transparent text-white focus:outline-none focus:ring-0 focus:border-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskSubtasks;
