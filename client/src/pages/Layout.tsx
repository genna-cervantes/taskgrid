import { Outlet, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const Layout = () => {
  const { projectId } = useParams();

  const [toggleSidebar, setToggleSidebar] = useState<boolean>(false);
  const [toggleAIChat, setToggleAIChat] = useState<boolean>(false);
  const [messages, setMessages] = useState<{ content: string; role: string }[]>(
    []
  );
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendPrompt = async () => {
    if (!prompt.trim() || isStreaming) return;

    const userMessage = { role: "user", content: prompt };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setPrompt("");

    const assistantMessage = { role: "ai", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    const response = await fetch("http://localhost:3000/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, prompt }),
    });

    if (response && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataContent = line.slice(6); // Remove 'data: ' and whitespace
            if (dataContent && dataContent !== "[DONE]") {
              try {
                const content = JSON.parse(dataContent); 

                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];

                  // Update the last message
                  if (lastMessage && lastMessage.role === "ai") {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...lastMessage,
                      content: lastMessage.content + content,
                    };
                    return newMessages;
                  }
                  return prev;
                });
              } catch (err) {
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];

                  // Update the last message
                  if (lastMessage && lastMessage.role === "ai") {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...lastMessage,
                      content: lastMessage.content + `\n\n ${err}`,
                    };
                    return newMessages;
                  }
                  return prev;
                });
              }
            }
          }
        }
      }
    } else {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];

        // Update the last message
        if (lastMessage && lastMessage.role === "ai") {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            content:
              lastMessage.content +
              "\n\n An error has occured, unable to process request",
          };
          return newMessages;
        }
        return prev;
      });
    }
  };

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
        {toggleAIChat && <ResizableHandle className="mx-1" withHandle />}
        {toggleAIChat && (
          <ResizablePanel defaultSize={20} className="min-w-80">
            <div
              className={`transition-all w-full px-2 h-full duration-200 pt-4 flex flex-col justify-between ${
                !toggleAIChat ? "top-0 w-[5rem]" : "top-0 w-[22rem]"
              }`}
            >
              <div className="w-full overflow-y-auto super-thin-scrollbar flex-1">
                {messages.map((m) => {
                  return m.role === "ai" ? (
                    <div className="text-xs whitespace-pre-wrap text-fadedWhite max-w-[80%] w-fit px-2 py-2 mb-3 bg-faintBlack rounded-md">
                      {m.content}
                    </div>
                  ) : (
                    <div className="flex justify-end w-full">
                      <div className="text-xs text-fadedWhite max-w-[80%] px-2 py-2 mb-3 text-right bg-faintBlack rounded-md">
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-y-1 w-full">
                <span className="flex items-center text-midWhite">
                  <Info className="h-3" />
                  <p className="text-xxs italic">press enter to send prompt</p>
                </span>
                <Textarea
                  onKeyDown={(e) => {
                    if (e.shiftKey) {
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendPrompt();
                    }
                  }}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type your message here."
                  className="super-thin-scrollbar w-full focus:ring-0 active:border-none active:ring-0 active:outline-none focus:border-none focus:outline-none bg-faintBlack !border-none text-sm text-fadedWhite placeholder:text-sm placeholder:text-faintWhite"
                />
              </div>
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>

      {/* {toggleAIChat && (
      )} */}
    </main>
  );
};

export default Layout;
