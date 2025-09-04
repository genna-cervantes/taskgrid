import React, { useEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel } from "./ui/resizable";
import { DefaultChatTransport, UIMessage } from "ai";
import { Textarea } from "./ui/textarea";
import { Info } from "lucide-react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { trpc } from "@/utils/trpc";
import { useChat } from "@ai-sdk/react";

const AIChat = ({ toggleAIChat }: { toggleAIChat: boolean }) => {
  const { projectId } = useParams();
  const utils = trpc.useUtils();

  let location = useLocation();
  const path = location.pathname;
  const lastPart = path.split("/").pop();
  const isInProjects = lastPart === "board";

  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const chatBoxInputRef = useRef<HTMLTextAreaElement | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const [prompt, setPrompt] = useState("");

  const [states, setStates] = useState<Record<string, boolean>>({});

  const { messages, sendMessage } = useChat({
    // messages: initial messages fetched from db
    // change for every project ok
    transport: new DefaultChatTransport({
      api: "http://localhost:3000/ai-chat",
      body: () => ({ projectId, prompt }),
      credentials: "include",
    }),
    onFinish() {
      utils.tasks.getTasks.invalidate();
    },
    onData(part) {
      if (part.type === "data-state") {
        // on data-state trigger a state var that will trigger a usestate that will update the value of the specific element via id

        console.log("on data");
        const { text, visible } = part.data as {
          text: string;
          visible: boolean;
        };
        setStates((prev) => ({
          ...prev,
          [text]: visible,
        }));

        // while rendering check if the text is already in the state and skip that
      } else if (part.type === "data-query") {
        console.log("called");

        try {
          const data = part.data as { filteredTaskIds: number[] };
          const newParams = new URLSearchParams(searchParams?.toString() || "");
          newParams.set("projectTaskIds", data.filteredTaskIds.join(","));
          setSearchParams(newParams);
          console.log("done");
        } catch (err) {
          console.error(err);
        }
      } else if (part.type === "data-generated") {
        utils.tasks.getTasks.invalidate();
      } else if (part.type === "data-error") {
        setStates({});
      }
    },
  });

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    console.log(messages);
  }, [messages]);

  useEffect(() => {
    if (toggleAIChat) {
      chatBoxInputRef.current?.focus();
    }
  }, [toggleAIChat]);

  return (
    <>
      {toggleAIChat && !!projectId && (
        <ResizableHandle className="mx-1" withHandle />
      )}
      {toggleAIChat && !!projectId && (
        <ResizablePanel defaultSize={20} className="min-w-80">
          <div
            className={`transition-all w-full pl-2 h-full duration-200 pt-4 flex flex-col justify-between gap-y-1 ${
              !toggleAIChat ? "top-0 w-[5rem]" : "top-0 w-[22rem]"
            }`}
          >
            <div
              ref={chatBoxRef}
              className="w-full overflow-y-auto super-thin-scrollbar flex-1 whitespace-pre-wrap"
            >
              {messages.length <= 0 && (
                <div className="flex flex-col h-full justify-center text-center px-4">
                  <h1 className="text-base font-bold text-fadedWhite">
                    Meet Your AI Project Partner
                  </h1>
                  <p className="text-xs mt-1 italic text-midWhite">
                    Generate tasks from meeting notes, or simply ask What should
                    I prioritize today?”
                  </p>
                </div>
              )}
              {messages.map((m: UIMessage) => {
                return m.role === "assistant" ? (
                  <div
                    key={m.id}
                    className="text-xs whitespace-pre-wrap text-fadedWhite max-w-[80%] w-fit px-2 py-2 mb-3 bg-faintBlack rounded-md"
                  >
                    {m.parts.map((p, i) => {
                      if (p.type === "text") {
                        return (
                          <React.Fragment key={i}>{p.text}</React.Fragment>
                        );
                      } else if (p.type === "data-state") {
                        const data = p.data as { text: string };

                        let prev = states[data.text];
                        if (!prev) return null;

                        return (
                          <>
                            <br />
                            <span
                              id={data.text}
                              className="animate-pulse text-purple-300"
                            >
                              {data.text}
                            </span>
                          </>
                        );
                      } else if (p.type === "data-text") {
                        return <br key={i} />;
                      } else if (p.type === "data-generated") {
                        return (
                          <p className="text-purple-200 text-xxs italic">
                            {(p.data as any).text}
                          </p>
                        );
                      } else if (p.type === "data-error") {
                        return (
                          <span className="text-red-400">
                            {(p.data as any).text}
                          </span>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-end w-full">
                    <div className="text-xs text-fadedWhite max-w-[80%] px-2 py-2 mb-3 text-right bg-faintBlack rounded-md">
                      {m.parts.map((p, i) =>
                        p.type === "text" ? p.text : null
                      )}
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
                ref={chatBoxInputRef}
                onKeyDown={(e) => {
                  if (e.shiftKey) {
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();

                    if (!projectId) return;
                    sendMessage({ text: prompt });
                    setPrompt("");
                  }
                }}
                disabled={!isInProjects}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your message here."
                className="super-thin-scrollbar w-full focus:ring-0 active:border-none active:ring-0 active:outline-none focus:border-none focus:outline-none bg-faintBlack !border-none text-sm text-fadedWhite placeholder:text-sm placeholder:text-faintWhite"
              />
            </div>
          </div>
        </ResizablePanel>
      )}
    </>
  );
};

export default AIChat;
