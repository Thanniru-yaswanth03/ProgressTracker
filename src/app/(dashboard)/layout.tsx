import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AiAssistantTrigger } from "@/components/features/ai/AiAssistantTrigger";
import {
  Activity as ActivityIcon,
  BarChart3,
  Calendar,
  CheckSquare,
  Flame,
  Layers,
  LayoutDashboard,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl shadow-xs dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Nav Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <ActivityIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                Progress<span className="text-indigo-600 dark:text-indigo-400">Tracker</span>
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/sections"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Sections</span>
              </Link>

              <Link
                href="/tasks"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Tasks</span>
              </Link>

              <Link
                href="/habits"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Habits</span>
              </Link>

              <Link
                href="/goals"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <Target className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Goals</span>
              </Link>

              <Link
                href="/activities"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Activities</span>
              </Link>

              <Link
                href="/history"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                <span>History</span>
              </Link>

              <Link
                href="/analytics"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                <span>Analytics</span>
              </Link>
            </nav>
          </div>

          {/* Theme Switcher, User Profile & Logout */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Floating AI Assistant Trigger */}
      <AiAssistantTrigger />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-850 py-6 text-center text-xs text-slate-500 bg-white/50 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Multi-tenant session isolation enabled</span>
          </div>
          <span>Progress Tracker &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
