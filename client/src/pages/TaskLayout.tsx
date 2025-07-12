import { Outlet } from "react-router-dom";

const TaskLayout = () => {
  return <div className="w-full">
      <Outlet />
  </div>
};

export default TaskLayout;
