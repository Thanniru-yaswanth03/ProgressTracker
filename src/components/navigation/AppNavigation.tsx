"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  Activity,
  BarChart3,
  Calendar,
  CheckSquare,
  Flame,
  Layers,
  LayoutDashboard,
  Menu,
  Shield,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppNavigationProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Sections",
    href: "/sections",
    icon: Layers,
    badge: null,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    badge: null,
  },
  {
    label: "Habits",
    href: "/habits",
    icon: Flame,
    badge: null,
  },
  {
    label: "Goals",
    href: "/goals",
    icon: Target,
    badge: null,
  },
  {
    label: "Activities",
    href: "/activities",
    icon: Sparkles,
    badge: null,
  },
  {
    label: "History",
    href: "/history",
    icon: Calendar,
    badge: null,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    badge: null,
  },
];

export function AppNavigation({ user }: AppNavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ─── Desktop Left Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--surface)] border-r border-[var(--border)] fixed inset-y-0 left-0 z-30 transition-all duration-200">
        {/* Brand Logo Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-amber-500 flex items-center justify-center shadow-sm shadow-orange-900/10 group-hover:scale-105 transition-transform">
              <Activity className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-lg text-[var(--foreground)] tracking-tight">
              Progress<span className="text-[var(--primary)]">Tracker</span>
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Productivity Workspace
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group relative",
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)] shadow-xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        active
                          ? "text-[var(--primary)]"
                          : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile & Theme Switcher */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] space-y-2.5 bg-[var(--surface)]">
          {/* User Profile Card */}
          <div className="p-2 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-[var(--foreground)] truncate">
                  {user.name || "User"}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] truncate">
                  {user.email}
                </span>
              </div>
            </div>

            <ThemeToggle className="shrink-0" />
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span>Isolated Session</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ─── Mobile Header & Drawer ─── */}
      <header className="lg:hidden sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] shadow-xs">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[var(--primary)] to-amber-500 flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span className="font-bold text-base text-[var(--foreground)] tracking-tight">
              Progress<span className="text-[var(--primary)]">Tracker</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--border)] bg-[var(--surface-elevated)] p-4 space-y-3 animate-enter-fade">
            <nav className="grid grid-cols-2 gap-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      active
                        ? "bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Profile Footer */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="text-xs text-[var(--foreground)] font-medium">
                  {user.name}
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
