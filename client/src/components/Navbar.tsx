import React from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="w-full flex justify-center items-center">
      <ul className="flex gap-x-10 font-mono text-xl">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "font-black underline"
                : "hover:font-black hover:underline"
            }
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              isActive ? "font-black underline" : "hover:font-black hover:underline"
            }
          >
            Projects
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive ? "font-black underline" : "hover:font-black hover:underline"
            }
          >
            Contact
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
