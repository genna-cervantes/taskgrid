import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AIChat from "@/components/AIChat";

const Layout = () => {

  const [toggleSidebar, setToggleSidebar] = useState<boolean>(false);
  const [toggleAIChat, setToggleAIChat] = useState<boolean>(false);

  return (
    <main className="w-full h-screen flex dark:bg-[#1A1A1A] bg-lmBackground dark:text-[#F5F5F5] text-fadedBlack font-jetbrains overflow-y-hidden">
      <Sidebar
        toggleSidebar={toggleSidebar}
        setToggleSidebar={setToggleSidebar}
        toggleAIChat={toggleAIChat}
        setToggleAIChat={setToggleAIChat}
      />
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full h-full py-3 pl-1 pr-3"
      >
        <ResizablePanel
          defaultSize={toggleAIChat ? 80 : 100}
          className="min-w-[60%]"
        >
          <div className="h-full bg-faintBlack rounded-md px-4 py-3 flex flex-col overflow-x-hidden w-full">
            <Outlet
              context={{ setToggleSidebar, setToggleAIChat, toggleAIChat }}
            />
          </div>
        </ResizablePanel>
        <AIChat toggleAIChat={toggleAIChat} />
      </ResizablePanelGroup>
    </main>
  );
};

export default Layout;
