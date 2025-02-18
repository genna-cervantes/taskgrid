import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const Layout = () => {
  return (
    <main className="w-full h-screen py-10 bg-radial-[at_50%_75%] from-rose-300 via-rose-200 to-rose-100">
      <Navbar />
      <Outlet />
    </main>
  );
};

export default Layout;
