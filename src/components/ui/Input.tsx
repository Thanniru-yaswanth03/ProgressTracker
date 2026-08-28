import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      icon,
      endAdornment,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 text-[var(--muted-foreground)] flex items-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 transition-all duration-150 focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)] hover:border-[var(--border-strong)]",
              icon && "pl-10",
              endAdornment && "pr-10",
              error
                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                : "",
              className
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-3.5 flex items-center text-[var(--muted-foreground)]">
              {endAdornment}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[var(--muted-foreground)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
