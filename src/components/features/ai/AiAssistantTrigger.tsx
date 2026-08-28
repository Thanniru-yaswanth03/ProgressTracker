"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { AiAssistantDrawer } from "./AiAssistantDrawer";

export function AiAssistantTrigger() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [initialPrompt, setInitialPrompt] = React.useState<string | null>(null);

  // Global event listener so other components can open the AI Assistant with custom prompts
  React.useEffect(() => {
    const handleOpenAI = (e: CustomEvent<{ prompt?: string }>) => {
      if (e.detail?.prompt) {
        setInitialPrompt(e.detail.prompt);
      }
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+J or Alt+A to open AI Assistant
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("open-ai-assistant" as unknown as keyof WindowEventMap, handleOpenAI as EventListener);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-ai-assistant" as unknown as keyof WindowEventMap, handleOpenAI as EventListener);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center group">
        <button
          type="button"
          onClick={() => {
            setInitialPrompt(null);
            setIsOpen(true);
          }}
          aria-label="Open AI Progress Assistant"
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs sm:text-sm shadow-md hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all cursor-pointer border border-[var(--primary-hover)]"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>

          <span className="tracking-tight">AI Assistant</span>

          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 font-mono text-white">
            Ctrl+J
          </span>
        </button>
      </div>

      {/* Slide-out Drawer */}
      <AiAssistantDrawer
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setInitialPrompt(null);
        }}
        initialPrompt={initialPrompt}
      />
    </>
  );
}
