import React from "react";

const SidebarButton = ({
  openSidebar,
  setOpenSidebar,
}: {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <button className="flex items-center justify-center mt-5 cursor-pointer" onClick={() => setOpenSidebar(!openSidebar)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-menu-icon lucide-menu"
      >
        <path d="M4 12h16" />
        <path d="M4 18h16" />
        <path d="M4 6h16" />
      </svg>
    </button>
  );
};

export default SidebarButton;
