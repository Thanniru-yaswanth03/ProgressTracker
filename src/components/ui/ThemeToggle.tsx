"use client";

import * as React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={cn(
        "relative p-2 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        isDark
          ? "bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-amber-400 shadow-xs"
          : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-orange-600 shadow-xs",
        className
      )}
      title={isDark ? "Switch to Light Warm Mode" : "Switch to Dark Charcoal Mode"}
      aria-label={isDark ? "Switch to Light Warm Mode" : "Switch to Dark Charcoal Mode"}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={cn(
            "w-4 h-4 absolute inset-0 transition-transform duration-300",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-amber-600"
          )}
        />
        <Moon
          className={cn(
            "w-4 h-4 absolute inset-0 transition-transform duration-300",
            isDark ? "rotate-0 scale-100 opacity-100 text-amber-300" : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
    </button>
  );
}
