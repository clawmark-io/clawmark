import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SidebarIconButtonProps = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  warning?: boolean;
  onClick?: () => void;
};

export function SidebarIconButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  warning = false,
  onClick,
}: SidebarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="btn btn-ghost btn-square relative text-[var(--text-subtle)] hover:bg-[var(--surface-overlay-hover)] hover:text-base-content data-[active]:bg-[var(--surface-overlay-hover)] data-[active]:text-base-content disabled:opacity-35 disabled:bg-transparent disabled:text-muted"
          data-active={active || undefined}
        >
          <Icon size={20} />
          {warning ? (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-error" />
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
