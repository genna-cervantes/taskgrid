import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

const Layout = () => {

  const [toggleSidebar, setToggleSidebar] = useState<boolean>(false);

  return (
    <main className="w-full h-screen flex dark:bg-[#1A1A1A] bg-lmBackground dark:text-[#F5F5F5] text-fadedBlack font-jetbrains overflow-y-hidden">
      <Sidebar toggleSidebar={toggleSidebar} setToggleSidebar={setToggleSidebar} />
      <div className="ml-[0.35rem] bg-faintBlack mr-3 my-3 rounded-md px-4 py-3 flex flex-col overflow-hidden w-full">
        <Outlet context={{ setToggleSidebar }} />
      </div>
    </main>
  );
};

export default Layout;
