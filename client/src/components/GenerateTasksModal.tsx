import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2, Sparkles, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useStream } from "@/hooks/useStream";
import { InsertableTriageTask, TriageTask } from "../../../server/src/shared/types";
import { trpc } from "@/utils/trpc";

const GenerateTasksModal = ({
  setGenerateTasksModal,
  setIsGenerating,
  text,
  setText,
  startStream,
  isLoading,
}: {
  setGenerateTasksModal: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  startStream: () => void;
  isLoading: boolean;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 400;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [text]);

  const handleGenerate = () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    startStream(); 
  };

  const onClose = () => {
    setGenerateTasksModal(false);
    setText("");
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 ">
          <h2 className="text-white text-sm font-medium">Generate Tasks</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 flex flex-col gap-y-3">
          <Textarea
            ref={textareaRef}
            placeholder="Generate tasks from free text (meeting notes, conversations, etc.)!"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] max-h-[400px] super-thin-scrollbar bg-inherit border focus:ring-0 focus:outline-none border-faintWhite text-white placeholder:text-zinc-500 text-sm resize-none focus:border-zinc-600 overflow-y-auto"
          />

          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!text.trim() || isLoading}
              className="bg-gradient-to-r from-purple-300 to-pink-300 text-backgroundDark py-1 px-3 text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateTasksModal;
