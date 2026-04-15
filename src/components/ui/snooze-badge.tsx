import { formatDueDate } from "@/lib/utils/date-utils.ts";
import type { DueDateDisplayMode } from "@/types/data-model";

type SnoozeBadgeProps = {
  snoozeUntil: number;
  displayMode?: DueDateDisplayMode;
  onColor?: boolean;
};

export function SnoozeBadge({ snoozeUntil, displayMode = "date", onColor = false }: SnoozeBadgeProps) {
  const className = [
    "badge badge-sm gap-1 w-fit",
    "bg-[var(--surface-overlay-hover)] text-[var(--text-subtle)] border-transparent",
    onColor ? "bg-[oklch(0_0_0/8%)]! text-inherit! border-transparent" : "",
  ].filter(Boolean).join(" ");

  return (
    <span className={className}>
      <span className="text-[10px] font-bold leading-none">zZz</span>
      {formatDueDate(snoozeUntil, displayMode)}
    </span>
  );
}
