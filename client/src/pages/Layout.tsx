import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const Layout = () => {
  return (
    <main className="w-full h-screen flex flex-col bg-[#1A1A1A] text-[#F5F5F5]">
      {/* <Navbar /> */}
      <Outlet />
    </main>
  );
};

export default Layout;
