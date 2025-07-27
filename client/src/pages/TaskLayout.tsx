import { Outlet } from "react-router-dom";

const TaskLayout = () => {

  console.log('calling task layout')

  return <div className="w-full h-full overflow-y-hidden">
      <Outlet />
  </div>
};

export default TaskLayout;
