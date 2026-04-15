import type { DueDateDisplayMode } from "@/types/data-model.ts";
import i18n from "@/i18n.ts";

// Format as date: "Jan 15" or "Jan 15, 2025"
export function formatAsDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const locale = i18n.language;
  const isSameYear = date.getFullYear() === now.getFullYear();

  if (isSameYear) {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
  }
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

// Format as day: "Today", "Tomorrow", "In 7 days", "3 days ago"
export function formatAsDay(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = taskDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });
  return rtf.format(diffDays, "day");
}

// Format as time remaining: "in 2d 5h", "in 20m", "5h ago"
export function formatAsTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const diffAbs = Math.abs(diff);

  const minutes = Math.floor(diffAbs / (1000 * 60));
  const hours = Math.floor(diffAbs / (1000 * 60 * 60));
  const days = Math.floor(diffAbs / (1000 * 60 * 60 * 24));

  const isPastDue = diff < 0;
  const prefix = isPastDue ? "" : "in ";
  const suffix = isPastDue ? " ago" : "";

  // Show two units for better precision when there's a fractional part
  if (days >= 1) {
    const remainingHours = Math.floor((diffAbs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (remainingHours > 0 && days < 30) {
      return `${prefix}${days}d ${remainingHours}h${suffix}`;
    }
    return `${prefix}${days}d${suffix}`;
  }
  if (hours >= 1) {
    const remainingMinutes = Math.floor((diffAbs % (1000 * 60 * 60)) / (1000 * 60));
    if (remainingMinutes > 0 && hours < 24) {
      return `${prefix}${hours}h ${remainingMinutes}m${suffix}`;
    }
    return `${prefix}${hours}h${suffix}`;
  }
  if (minutes >= 1) {
    return `${prefix}${minutes}m${suffix}`;
  }
  return "now";
}

export function formatDueDate(timestamp: number, mode: DueDateDisplayMode): string {
  switch (mode) {
    case "date":
      return formatAsDate(timestamp);
    case "day":
      return formatAsDay(timestamp);
    case "time":
      return formatAsTime(timestamp);
  }
}

export function isOverdue(timestamp: number): boolean {
  return timestamp < Date.now();
}
