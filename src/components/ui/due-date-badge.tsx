import { Calendar } from "lucide-react";
import { formatDueDate, isOverdue } from "@/lib/utils/date-utils.ts";
import type { DueDateDisplayMode } from "@/types/data-model";

type DueDateBadgeProps = {
  dueDate: number;
  displayMode: DueDateDisplayMode;
  completed?: boolean;
  onColor?: boolean;
};

export function DueDateBadge({ dueDate, displayMode, completed = false, onColor = false }: DueDateBadgeProps) {
  const overdue = !completed && isOverdue(dueDate);

  const className = [
    "badge badge-sm gap-1 w-fit",
    overdue ? "badge-error" : "bg-[var(--surface-overlay-hover)] text-[var(--text-subtle)] border-transparent",
    onColor && !overdue ? "bg-[oklch(0_0_0/8%)]! text-inherit! border-transparent" : "",
    onColor && completed && !overdue ? "opacity-60" : "",
  ].filter(Boolean).join(" ");

  return (
    <span className={className}>
      <Calendar size={12} />
      {formatDueDate(dueDate, displayMode)}
    </span>
  );
}
