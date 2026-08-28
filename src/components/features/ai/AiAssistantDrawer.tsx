"use client";

import * as React from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  RotateCcw,
  Zap,
  Target,
  ChevronRight,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChatMessage, AIPriorityItem, AIResponseDTO } from "@/types";

export interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string | null;
}

const SUGGESTED_PROMPTS = [
  { label: "What should I do today?", icon: Zap },
  { label: "I have 30 minutes. What should I prioritize?", icon: Clock },
  { label: "Summarize my progress this week", icon: Sparkles },
  { label: "Which goals am I falling behind on?", icon: Target },
  { label: "Which overdue tasks are most important?", icon: AlertTriangle },
  { label: "How is my habit streak doing?", icon: Flame },
];

export function AiAssistantDrawer({
  isOpen,
  onClose,
  initialPrompt,
}: AiAssistantDrawerProps) {
  const [messages, setMessages] = React.useState<AIChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Hello! I'm your ProgressTracker AI Assistant. I have direct context on your live tasks, habits, goals, focus minutes, and streaks. How can I help you optimize your momentum today?",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Handle initial prompt if passed
  React.useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Handle Escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (userText: string) => {
    const text = userText.trim();
    if (!text || isLoading) return;

    setError(null);
    setInput("");

    const userMessage: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const payload = {
        messages: newMessages
          .filter((m) => m.id !== "welcome-msg")
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
      };

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to get response from AI Assistant.");
      }

      const structuredData: AIResponseDTO = json.data;

      const assistantMessage: AIChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: structuredData.answer,
        structuredData,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error("AI Chat error:", err);
      const errMsg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "Conversation reset. What would you like to explore regarding your progress, tasks, or habits?",
        createdAt: new Date().toISOString(),
      },
    ]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-enter-fade"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Progress Assistant"
        className="relative w-full max-w-xl sm:max-w-2xl h-full bg-[var(--surface)] text-[var(--foreground)] border-l border-[var(--border)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-sub)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center justify-center text-[var(--primary)] shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] tracking-tight">
                  Progress AI Assistant
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Grounded Data
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Reasoning over your personal tasks, streaks, goals, and focus time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleReset}
              title="Reset conversation"
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close drawer"
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips (Shown on top of chat) */}
        <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface)] shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Quick Prompts:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt.label)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-[var(--surface-sub)] hover:bg-[var(--primary-soft)] text-[var(--foreground)] hover:text-[var(--primary)] border border-[var(--border-subtle)] hover:border-[var(--primary-soft-border)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <Icon className="w-3 h-3 text-[var(--primary)]" />
                  <span>{prompt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[var(--background)]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3 animate-enter-fade",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs",
                  msg.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-sub)] border border-[var(--border)] text-[var(--primary)]"
                )}
              >
                {msg.role === "user" ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble Content */}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3",
                  msg.role === "user"
                    ? "bg-[var(--primary)] text-white rounded-tr-xs"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-xs shadow-xs"
                )}
              >
                {/* Regular text or Markdown Answer */}
                {msg.structuredData ? (
                  <StructuredAIResponseView data={msg.structuredData} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}

                <div
                  className={cn(
                    "text-[10px] pt-1 flex items-center justify-end",
                    msg.role === "user" ? "text-white/80" : "text-[var(--muted-foreground)]"
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-enter-fade">
              <div className="w-8 h-8 rounded-xl bg-[var(--surface-sub)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl rounded-tl-xs p-4 flex items-center gap-3 shadow-xs">
                <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />
                <span className="text-xs text-[var(--muted-foreground)]">
                  Analyzing tasks, habits, and momentum records...
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-800 dark:text-rose-200">Error</p>
                <p className="mt-0.5 text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-sub)] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your tasks, goals, streaks, or focus time..."
                disabled={isLoading}
                maxLength={2000}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)] transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
            <span>Powered by OpenRouter &bull; Privacy preserved</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sub-component to render rich structured AI responses (priorities, insights, warnings, actions).
 */
function StructuredAIResponseView({ data }: { data: AIResponseDTO }) {
  const priorityBadgeConfig = {
    critical: {
      label: "Critical Urgency",
      bg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
      icon: Flame,
    },
    high: {
      label: "High Priority",
      bg: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25",
      icon: Clock,
    },
    medium: {
      label: "Medium Priority",
      bg: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
      icon: ChevronRight,
    },
    low: {
      label: "Low Priority",
      bg: "bg-[var(--surface-sub)] text-[var(--muted-foreground)] border-[var(--border)]",
      icon: CheckCircle2,
    },
  };

  return (
    <div className="space-y-3.5 text-[var(--foreground)]">
      {/* 1. Executive Summary */}
      {data.summary && (
        <div className="p-3 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] text-[var(--foreground)] text-xs font-medium flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
          <div className="leading-relaxed">{data.summary}</div>
        </div>
      )}

      {/* 2. Main Markdown Answer */}
      <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
        {data.answer}
      </div>

      {/* 3. Prioritized Tasks / Action Items */}
      {data.priorities && data.priorities.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Intelligent Priority Sequence</span>
          </div>

          <div className="space-y-2">
            {data.priorities.map((item: AIPriorityItem, i: number) => {
              const cfg = priorityBadgeConfig[item.priority] || priorityBadgeConfig.medium;
              const Icon = cfg.icon;

              return (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] space-y-1.5 text-left shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[var(--surface)] text-[10px] text-[var(--muted-foreground)] flex items-center justify-center border border-[var(--border-subtle)]">
                        {i + 1}
                      </span>
                      {item.taskTitle}
                    </span>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0",
                        cfg.bg
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--muted-foreground)] pl-5 leading-relaxed">
                    {item.reason}
                  </p>

                  {item.estimatedMinutes && (
                    <div className="pl-5 text-[10px] text-sky-600 dark:text-sky-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Est. {item.estimatedMinutes} mins</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Analytical Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Key Progress Insights</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800/90 dark:text-emerald-300/90 pl-1">
            {data.insights.map((ins: string, idx: number) => (
              <li key={idx}>{ins}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Warnings & Risks */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Attention Required</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800/90 dark:text-amber-300/90 pl-1">
            {data.warnings.map((warn: string, idx: number) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Concrete Suggested Actions */}
      {data.suggestedActions && data.suggestedActions.length > 0 && (
        <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-[var(--foreground)] text-xs space-y-1">
          <div className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Suggested Next Actions</span>
          </div>
          <ul className="space-y-1 text-[11px] pl-1">
            {data.suggestedActions.map((act: string, idx: number) => (
              <li key={idx} className="flex items-start gap-1.5 text-[var(--muted-foreground)]">
                <span className="text-sky-600 dark:text-sky-400 mt-0.5">&bull;</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
