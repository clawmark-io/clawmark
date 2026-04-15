import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { TagFilterInput } from "@/components/ui/tag-filter-input";
import { DateFilterDropdown } from "./date-filter-dropdown";
import type { UpcomingFilterMode } from "@/lib/upcoming-utils";
import type { Tag } from "@/types/data-model";

type UpcomingToolbarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  projectTags: Tag[];
  projectFilter: string | null;
  onProjectFilterChange: (projectId: string | null) => void;
  projects: { id: string; title: string }[];
  taskCount: number;
  showSnoozed: boolean;
  onShowSnoozedChange: (show: boolean) => void;
  filterMode: UpcomingFilterMode;
  onFilterModeChange: (mode: UpcomingFilterMode) => void;
};

export function UpcomingToolbar({
  searchQuery,
  onSearchChange,
  selectedTagIds,
  onTagsChange,
  projectTags,
  projectFilter,
  onProjectFilterChange,
  projects,
  taskCount,
  showSnoozed,
  onShowSnoozedChange,
  filterMode,
  onFilterModeChange,
}: UpcomingToolbarProps) {
  const { t } = useTranslation("tasks");
  return (
    <div className="flex gap-3 mb-1 flex-col lg:flex-row lg:items-center">
      <TagFilterInput
        textValue={searchQuery}
        onTextChange={onSearchChange}
        selectedTagIds={selectedTagIds}
        onTagsChange={onTagsChange}
        projectTags={projectTags}
        placeholder={t("searchUpcomingPlaceholder")}
      />
      <div className="flex gap-3 items-center flex-wrap">
        <DateFilterDropdown filterMode={filterMode} onFilterModeChange={onFilterModeChange} />
        <select
          className="select select-bordered no-focus-outline w-auto"
          value={projectFilter ?? ""}
          onChange={(e) => onProjectFilterChange(e.target.value || null)}
        >
          <option value="">{t("allProjects")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="btn btn-default">
              <SlidersHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={showSnoozed}
              onCheckedChange={onShowSnoozedChange}
            >
              {t("showSnoozed")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="whitespace-nowrap badge badge-neutral ml-auto">
          {t("taskCount", { ns: "common", count: taskCount })}
        </span>
      </div>
    </div>
  );
}
