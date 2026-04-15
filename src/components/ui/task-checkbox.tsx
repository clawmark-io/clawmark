import { Check } from "lucide-react";
import { cn } from "@/lib/utils/tailwind-utils.ts";

type TaskCheckboxProps = {
  checked: boolean;
  onColor?: boolean;
  taskColor?: string | null;
};

export function TaskCheckbox({
  checked,
  onColor = false,
  taskColor,
}: TaskCheckboxProps) {
  const circleClass = cn(
    "inline-flex items-center justify-center size-[18px] rounded-full shrink-0",
    "border-[1.5px] border-current transition-all duration-150",
    !checked && !onColor && "opacity-40",
    !checked && onColor && "opacity-50 bg-[oklch(0_0_0/6%)]",
    checked && "opacity-100 bg-current",
  );

  const checkStyle =
    onColor && taskColor ? { color: taskColor } : undefined;

  return (
    <span className={circleClass} aria-hidden="true">
      {checked ? (
        <Check
          size={12}
          strokeWidth={3}
          className={onColor ? undefined : "text-base-100"}
          style={checkStyle}
        />
      ) : null}
    </span>
  );
}
