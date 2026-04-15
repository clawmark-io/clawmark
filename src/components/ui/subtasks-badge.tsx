import { ListTodo } from "lucide-react";

type SubtasksBadgeProps = {
  completed: number;
  total: number;
  onColor?: boolean;
};

export function SubtasksBadge({ completed, total, onColor = false }: SubtasksBadgeProps) {
  if (total === 0) return null;

  const allCompleted = completed === total;

  const className = [
    "badge badge-sm gap-1 w-fit tabular-nums bg-[var(--surface-overlay-hover)] text-[var(--text-subtle)] border-transparent",
    allCompleted ? "bg-[var(--success-bg)]! text-[var(--success-text)]!" : "",
    onColor && !allCompleted ? "bg-[oklch(0_0_0/8%)]! text-inherit! border-transparent" : "",
  ].filter(Boolean).join(" ");

  return (
    <span className={className}>
      <ListTodo size={12} />
      {completed}/{total}
    </span>
  );
}
