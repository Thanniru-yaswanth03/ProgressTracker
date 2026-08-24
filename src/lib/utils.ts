import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Escapes user-provided input strings before constructing regular expressions
 * to prevent ReDoS attacks or regex syntax errors.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validates whether a given string is a valid ISO or standard date string without calendar rollover.
 */
export function isValidDateString(val: string): boolean {
  if (typeof val !== "string" || !val.trim()) return false;
  const d = new Date(val);
  if (isNaN(d.getTime())) return false;

  // For YYYY-MM-DD formatted segments, verify date didn't rollover (e.g. Feb 30)
  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const checkDate = new Date(Date.UTC(year, month - 1, day));
    if (
      checkDate.getUTCFullYear() !== year ||
      checkDate.getUTCMonth() + 1 !== month ||
      checkDate.getUTCDate() !== day
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Zod refinement schema for strict date string validation.
 */
export const dateStringSchema = z
  .string()
  .refine((val) => isValidDateString(val), {
    message: "Invalid date format or non-existent calendar date",
  });
