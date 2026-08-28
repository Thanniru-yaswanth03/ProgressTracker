"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = toast.duration ?? 3500;
      const newToast: ToastItem = { ...toast, id, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = React.useCallback(
    (message: string, description?: string) => {
      showToast({ type: "success", message, description });
    },
    [showToast]
  );

  const error = React.useCallback(
    (message: string, description?: string) => {
      showToast({ type: "error", message, description, duration: 5000 });
    },
    [showToast]
  );

  const warning = React.useCallback(
    (message: string, description?: string) => {
      showToast({ type: "warning", message, description, duration: 4000 });
    },
    [showToast]
  );

  const info = React.useCallback(
    (message: string, description?: string) => {
      showToast({ type: "info", message, description });
    },
    [showToast]
  );

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
  };

  const borderMap: Record<ToastType, string> = {
    success: "border-emerald-500/30 dark:border-emerald-500/20",
    error: "border-rose-500/30 dark:border-rose-500/20",
    warning: "border-amber-500/30 dark:border-amber-500/20",
    info: "border-sky-500/30 dark:border-sky-500/20",
  };

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, warning, info, dismissToast }}
    >
      {children}

      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="true"
            className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role="status"
                className={cn(
                  "pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--surface-elevated)] border shadow-[var(--shadow-dropdown)] text-[var(--foreground)] animate-toast-in transition-all",
                  borderMap[toast.type]
                )}
              >
                <div className="mt-0.5">{iconMap[toast.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-snug">{toast.message}</p>
                  {toast.description && (
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
