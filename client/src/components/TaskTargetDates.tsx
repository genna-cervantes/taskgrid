import React from "react";
import TargetDatePicker from "./TargetDatePicker";

const TaskTargetDates = ({taskTargetStartDate, taskTargetEndDate, setTaskTargetStartDate, setTaskTargetEndDate, taskTargetDateError, isPage=false}: {isPage?: boolean, taskTargetStartDate: Date | undefined, taskTargetEndDate: Date | undefined, setTaskTargetStartDate: React.Dispatch<React.SetStateAction<Date | undefined>>, setTaskTargetEndDate: React.Dispatch<React.SetStateAction<Date | undefined>>, taskTargetDateError: string}) => {
  return (
    <div className="flex flex-col gap-y-1 w-full">
      <div className="flex w-full gap-x-6">
        <div className="md:w-1/2">
          <h3
            className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
          >
            Target Start:
          </h3>

          <TargetDatePicker
            isPage={isPage}
            date={taskTargetStartDate}
            setDate={setTaskTargetStartDate}
          />
        </div>
        <div className="md:w-1/2">
          <h3
            className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
          >
            Target End:
          </h3>

          <TargetDatePicker
            isPage={isPage}
            date={taskTargetEndDate}
            setDate={setTaskTargetEndDate}
          />
        </div>
      </div>
      {taskTargetDateError !== "" && (
        <h4 className={`font-semibold text-xs text-red-400`}>
          {taskTargetDateError}
        </h4>
      )}
    </div>
  );
};

export default TaskTargetDates;
