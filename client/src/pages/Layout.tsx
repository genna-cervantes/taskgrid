import { Outlet, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import { trpc } from "@/utils/trpc";

const Layout = () => {
  const { projectId } = useParams();
  const utils = trpc.useUtils()

  const [toggleSidebar, setToggleSidebar] = useState<boolean>(false);
  const [toggleAIChat, setToggleAIChat] = useState<boolean>(false);

  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<{ content: string; role: string }[]>(
    []
  );

  const sendPrompt = async () => {
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);

    const res = await fetch("http://localhost:3000/ai-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        prompt,
      }),
    });

    if (!res.ok) {
      throw new Error(`Error creating tasks: ${res.statusText}`);
    }

    const message = await res.json();
    setMessages((prev) => [...prev, message.message]);
    utils.tasks.getTasks.invalidate()
  };

  return (
    <main className="w-full h-screen flex dark:bg-[#1A1A1A] bg-lmBackground dark:text-[#F5F5F5] text-fadedBlack font-jetbrains overflow-y-hidden">
      <Sidebar
        toggleSidebar={toggleSidebar}
        setToggleSidebar={setToggleSidebar}
        toggleAIChat={toggleAIChat}
        setToggleAIChat={setToggleAIChat}
      />
      <div className="ml-[0.35rem] bg-faintBlack mr-3 my-3 rounded-md px-4 py-3 flex flex-col overflow-x-hidden w-full">
        <Outlet context={{ setToggleSidebar, setToggleAIChat }} />
      </div>
      {toggleAIChat && (
        <div
          className={`transition-all h-full duration-200 pt-4 pb-4 flex flex-col justify-between mr-3 ${
            !toggleAIChat ? "top-0 w-[5rem]" : "top-0 w-[22rem]"
          }`}
        >
          <div className="w-full">
            {messages.map((m) => {
              return m.role === "ai" ? (
                <span className="text-xs flex text-fadedWhite max-w-[80%] px-2 py-2 mb-3 bg-faintBlack rounded-md">
                  {String(m.content)}
                </span>
              ) : (
                <div className="flex justify-end w-full">
                  <span className="text-xs text-fadedWhite max-w-[80%] px-2 py-2 mb-3 text-right bg-faintBlack rounded-md">
                    {m.content}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-y-1">
            <span className="flex items-center text-midWhite">
              <Info className="h-3" />
              <p className="text-xxs italic">click enter to send prompt</p>
            </span>
            <Textarea
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendPrompt();
                }
              }}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your message here."
              className="super-thin-scrollbar focus:ring-0 active:border-none active:ring-0 active:outline-none focus:border-none focus:outline-none bg-faintBlack !border-none text-sm text-fadedWhite placeholder:text-sm placeholder:text-faintWhite"
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default Layout;
