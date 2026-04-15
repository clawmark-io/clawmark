import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FILTER_MODE_CONFIG } from "@/lib/upcoming-utils";
import type { UpcomingFilterMode } from "@/lib/upcoming-utils";

type DateFilterDropdownProps = {
  filterMode: UpcomingFilterMode;
  onFilterModeChange: (mode: UpcomingFilterMode) => void;
};

export function DateFilterDropdown({ filterMode, onFilterModeChange }: DateFilterDropdownProps) {
  const { t } = useTranslation("tasks");
  const currentFilterLabel =
    FILTER_MODE_CONFIG.find((f) => f.mode === filterMode)?.label ?? ("filterShowUpcoming" as const);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="btn btn-default">
          <CalendarDays size={14} />
          {t(currentFilterLabel)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={filterMode}
          onValueChange={(v) => onFilterModeChange(v as UpcomingFilterMode)}
        >
          {FILTER_MODE_CONFIG.filter((f) => f.group === "main").map((f) => (
            <DropdownMenuRadioItem key={f.mode} value={f.mode}>
              {t(f.label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={filterMode}
          onValueChange={(v) => onFilterModeChange(v as UpcomingFilterMode)}
        >
          {FILTER_MODE_CONFIG.filter((f) => f.group === "date").map((f) => (
            <DropdownMenuRadioItem key={f.mode} value={f.mode}>
              {t(f.label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
