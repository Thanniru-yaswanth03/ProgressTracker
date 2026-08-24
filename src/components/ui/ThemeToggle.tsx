"use client";

import * as React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative p-2 rounded-xl border transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        isDark
          ? "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-amber-400 shadow-sm"
          : "bg-white hover:bg-slate-100 border-slate-200 text-indigo-600 shadow-sm"
      } ${className || ""}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={`w-4 h-4 absolute inset-0 transition-transform duration-300 ${
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-amber-500"
          }`}
        />
        <Moon
          className={`w-4 h-4 absolute inset-0 transition-transform duration-300 ${
            isDark ? "rotate-0 scale-100 opacity-100 text-indigo-300" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
    </button>
  );
}
