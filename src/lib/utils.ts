import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Money is stored as integer cents everywhere. Format only at the edges.
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Parses a user-typed dollar amount ("180", "$180.50", "1,180") into cents.
 * Returns null when the input isn't a usable amount, so callers decide how
 * to surface the error rather than silently charging the wrong number.
 */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!cleaned || !/^\d*\.?\d{0,2}$/.test(cleaned)) return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/**
 * "3 days", "1 day", "today", used on the board to show how long a job has
 * been sitting in its current stage. Deliberately coarse: hours-level
 * precision would imply the board is more real-time than it is.
 */
export function daysAgoLabel(from: Date, now: Date = new Date()): string {
  const ms = now.getTime() - from.getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
