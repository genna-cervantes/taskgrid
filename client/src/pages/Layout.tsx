import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <main className="w-full h-screen flex flex-col bg-[#1A1A1A] text-[#F5F5F5] font-rubik overflow-y-hidden">
      {/* <Navbar /> */}
      <Outlet />
    </main>
  );
};

export default Layout;
