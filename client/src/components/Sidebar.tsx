import React from "react";

const Sidebar = ({setOpenSidebar}: {setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all"
    onClick={() => setOpenSidebar(false)}>
      <div
        className="bg-[#464646] shadow-xl h-full w-[24rem] fixed left-0 flex justify-center py-8"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        {/* project block */}
        <div className="w-[85%] bg-[#282828] h-20 rounded-md">

        </div>
      </div>
    </div>
  );
};

export default Sidebar;
