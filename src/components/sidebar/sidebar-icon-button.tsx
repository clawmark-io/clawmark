import { AlertTriangle, type LucideIcon } from "lucide-react";
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
  warningTone?: "warning" | "error";
  warningTooltip?: string;
  onClick?: () => void;
};

export function SidebarIconButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  warning = false,
  warningTone = "warning",
  warningTooltip,
  onClick,
}: SidebarIconButtonProps) {
  const warningClassName = warningTone === "error" ? "text-error" : "text-warning";

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
            <span className={`absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-base-100 ${warningClassName}`}>
              <AlertTriangle size={12} fill="currentColor" strokeWidth={2.5} aria-hidden="true" />
            </span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {warning && warningTooltip ? (
          <div className="flex max-w-56 flex-col gap-1">
            <span>{label}</span>
            <span className={warningClassName}>{warningTooltip}</span>
          </div>
        ) : (
          label
        )}
      </TooltipContent>
    </Tooltip>
  );
}
