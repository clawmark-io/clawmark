import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { TagFilterInput } from "@/components/ui/tag-filter-input";
import { cn } from "@/lib/utils/tailwind-utils.ts";
import type { Tag } from "@/types/data-model";

type CompletedFilter = "all" | "active" | "completed";

type KanbanToolbarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  projectTags: Tag[];
  completedFilter: CompletedFilter;
  onCompletedFilterChange: (filter: CompletedFilter) => void;
  taskCount: number;
  showSnoozed: boolean;
  onShowSnoozedChange: (show: boolean) => void;
  showHiddenColumns: boolean;
  onShowHiddenColumnsChange: (show: boolean) => void;
  hasHiddenColumns: boolean;
};

export function KanbanToolbar({
  searchQuery,
  onSearchChange,
  selectedTagIds,
  onTagsChange,
  projectTags,
  completedFilter,
  onCompletedFilterChange,
  taskCount,
  showSnoozed,
  onShowSnoozedChange,
  showHiddenColumns,
  onShowHiddenColumnsChange,
  hasHiddenColumns,
}: KanbanToolbarProps) {
  const { t } = useTranslation("tasks");

  const FILTER_OPTIONS: { value: CompletedFilter; label: string }[] = [
    { value: "all", label: t("filterAll") },
    { value: "active", label: t("filterActive") },
    { value: "completed", label: t("filterDone") },
  ];

  return (
    <div className="flex gap-3 mb-1 flex-col lg:flex-row lg:items-center">
      <TagFilterInput
        textValue={searchQuery}
        onTextChange={onSearchChange}
        selectedTagIds={selectedTagIds}
        onTagsChange={onTagsChange}
        projectTags={projectTags}
        placeholder={t("searchTasksPlaceholder")}
      />
      <div className="flex gap-3 items-center flex-wrap">
        <div className="join">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={cn(`btn join-item`, completedFilter === opt.value && "btn-primary")}
              onClick={() => onCompletedFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
            {hasHiddenColumns ? (
              <DropdownMenuCheckboxItem
                checked={showHiddenColumns}
                onCheckedChange={onShowHiddenColumnsChange}
              >
                {t("showHiddenColumns")}
              </DropdownMenuCheckboxItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="whitespace-nowrap badge badge-neutral ml-auto">{t("taskCount", { ns: "common", count: taskCount })}</span>
      </div>
    </div>
  );
}
