import React from 'react'
import TargetDatePicker from './TargetDatePicker';

const TaskTargetEndDate = ({
  taskTargetEndDate,
  setTaskTargetEndDate,
  error,
  isPage = false,
}: {
  isPage?: boolean;
  taskTargetEndDate: Date | undefined;
  setTaskTargetEndDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  error: string|undefined;
}) => {
  return (
    <div className="md:w-1/2">
      <h3
        className={`${
          isPage ? "text-xs" : "text-xxs"
        } text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Target End:
      </h3>

      <TargetDatePicker
        isPage={isPage}
        date={taskTargetEndDate}
        setDate={setTaskTargetEndDate}
      />
      {error && (
        <p className="text-xs pb-2 text-red-400 !font-rubik text-start line-clamp-1">
          {error}
        </p>
      )}
    </div>
  );
};


export default TaskTargetEndDate