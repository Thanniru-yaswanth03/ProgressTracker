import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral" | "info";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-soft-border)]",
    secondary: "bg-[var(--secondary-soft)] text-[var(--secondary)] border-[var(--secondary)]/30",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    info: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
    neutral: "bg-[var(--surface-sub)] text-[var(--muted-foreground)] border-[var(--border)]",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-lg border leading-tight transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
