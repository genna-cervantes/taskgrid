import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <main className="w-full h-screen flex flex-col dark:bg-[#1A1A1A] bg-lmBackground dark:text-[#F5F5F5] text-fadedBlack font-rubik overflow-y-hidden">
      {/* <Navbar /> */}
      <Outlet />
    </main>
  );
};

export default Layout;
