import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const Layout = () => {
  return (
    <main className="w-full h-screen flex dark:bg-[#1A1A1A] bg-lmBackground dark:text-[#F5F5F5] text-fadedBlack font-jetbrains overflow-y-hidden">
      <Sidebar />
      <div className="ml-[0.35rem] bg-faintBlack mr-3 my-3 rounded-md px-4 py-3 flex flex-col overflow-hidden w-full">
        <Outlet />
      </div>
    </main>
  );
};

export default Layout;
