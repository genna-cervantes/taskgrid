import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox'; // Adjust path as needed

type Subtask = {
  title: string;
  isDone: boolean;
};

const TaskSubtasks = ({taskSubtasks, setTaskSubtasks, isPage=false}: {isPage?: boolean, taskSubtasks: Subtask[], setTaskSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>}) => {

  const handleTitleChange = (index: number, value: string) => {
    let updated = [...taskSubtasks];
    updated[index].title = value;

    if (value.trim() === '' && index !== taskSubtasks.length - 1) {
      updated.splice(index, 1);
      setTaskSubtasks(updated);
      return;
    }

    if (index === taskSubtasks.length - 1 && value.trim() !== '') {
      updated.push({ title: '', isDone: false });
    }

    setTaskSubtasks(updated);
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const updated = [...taskSubtasks];
    updated[index].isDone = checked;
    setTaskSubtasks(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-white">Sub Tasks:</label>
      {taskSubtasks.map((s, index) => (
        <div key={index} className="flex items-center space-x-2">
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
  );
};

export default TaskSubtasks;