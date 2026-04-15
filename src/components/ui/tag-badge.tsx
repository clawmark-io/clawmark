import { X } from "lucide-react";
import { useContrastText } from "@/hooks/use-contrast-text";
import type { Tag } from "@/types/data-model";

type TagBadgeProps = {
  tag: Tag;
  onColor?: boolean;
  onRemove?: () => void;
};

export function TagBadge({ tag, onColor = false, onRemove }: TagBadgeProps) {
  const hasColor = !!tag.color;
  const { textClass } = useContrastText(tag.color);

  const className = [
    "badge badge-sm border-none",
    onRemove ? "gap-0.5 pr-0.5" : "",
    onColor
      ? "bg-[oklch(0_0_0/8%)]! text-inherit!"
      : hasColor
        ? textClass
        : "badge-neutral",
  ]
    .filter(Boolean)
    .join(" ");

  const style =
    onColor || !hasColor
      ? undefined
      : { backgroundColor: tag.color };

  return (
    <span className={className} style={style}>
      #{tag.label}
      {onRemove ? (
        <button
          type="button"
          className="inline-flex items-center justify-center size-4 rounded-full hover:bg-[oklch(0_0_0/15%)] transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <X size={10} />
        </button>
      ) : null}
    </span>
  );
}
