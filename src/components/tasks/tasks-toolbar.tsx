import { useTranslation } from "react-i18next";
import { ArrowUpDown, Columns3, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TagFilterInput } from "@/components/ui/tag-filter-input";
import { cn } from '@/lib/utils/tailwind-utils.ts';
import type { Column, Tag } from "@/types/data-model";

type CompletedFilter = "all" | "active" | "completed";
type SortBy = "sortOrder" | "sortOrderGrouped" | "createdAt" | "dueDate" | "title";

type TasksToolbarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  projectTags: Tag[];
  completedFilter: CompletedFilter;
  onCompletedFilterChange: (filter: CompletedFilter) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  sortReversed: boolean;
  onSortReversedChange: (reversed: boolean) => void;
  taskCount: number;
  archivedCount: number;
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;
  showSnoozed: boolean;
  onShowSnoozedChange: (show: boolean) => void;
  columns: Column[];
  selectedColumnIds: string[];
  onColumnFilterChange: (columnIds: string[]) => void;
};

export function TasksToolbar({
  searchQuery,
  onSearchChange,
  selectedTagIds,
  onTagsChange,
  projectTags,
  completedFilter,
  onCompletedFilterChange,
  sortBy,
  onSortChange,
  sortReversed,
  onSortReversedChange,
  taskCount,
  archivedCount,
  showArchived,
  onShowArchivedChange,
  showSnoozed,
  onShowSnoozedChange,
  columns,
  selectedColumnIds,
  onColumnFilterChange,
}: TasksToolbarProps) {
  const { t } = useTranslation("tasks");

  const FILTER_OPTIONS: { value: CompletedFilter; label: string }[] = [
    { value: "all", label: t("filterAll") },
    { value: "active", label: t("filterActive") },
    { value: "completed", label: t("filterDone") },
  ];

  const SORT_OPTIONS: { value: SortBy; label: string }[] = [
    { value: "sortOrderGrouped", label: t("sortTodoFirst") },
    { value: "sortOrder", label: t("sortManual") },
    { value: "createdAt", label: t("sortCreated") },
    { value: "dueDate", label: t("sortDueDate") },
    { value: "title", label: t("sortTitle") },
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
        {columns.length > 0 ? (
          <ColumnFilterDropdown
            columns={columns}
            selectedColumnIds={selectedColumnIds}
            onColumnFilterChange={onColumnFilterChange}
          />
        ) : null}
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
            <DropdownMenuCheckboxItem
              checked={showArchived}
              onCheckedChange={onShowArchivedChange}
            >
              {t("showArchived")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SortDropdown
          sortBy={sortBy}
          onSortChange={onSortChange}
          sortReversed={sortReversed}
          onSortReversedChange={onSortReversedChange}
          options={SORT_OPTIONS}
        />
        <span className="whitespace-nowrap badge badge-neutral ml-auto">
          {t("taskCount", { ns: "common", count: taskCount })}
          {showArchived && archivedCount > 0 ? (
            <span className="tasks-toolbar-archived-count"> {t("archivedCount", { count: archivedCount })}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

type SortDropdownProps = {
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  sortReversed: boolean;
  onSortReversedChange: (reversed: boolean) => void;
  options: { value: SortBy; label: string }[];
};

function SortDropdown({ sortBy, onSortChange, sortReversed, onSortReversedChange, options }: SortDropdownProps) {
  const { t } = useTranslation("tasks");
  const currentLabel = options.find((o) => o.value === sortBy)?.label ?? "";
  const isManualSort = sortBy === "sortOrder" || sortBy === "sortOrderGrouped";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="btn btn-default">
          <ArrowUpDown size={14} />
          {currentLabel}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortChange(v as SortBy)}>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={sortReversed}
          onCheckedChange={onSortReversedChange}
          disabled={isManualSort}
          onSelect={(e) => e.preventDefault()}
        >
          {t("sortReverse")}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ColumnFilterDropdownProps = {
  columns: Column[];
  selectedColumnIds: string[];
  onColumnFilterChange: (columnIds: string[]) => void;
};

function ColumnFilterDropdown({ columns, selectedColumnIds, onColumnFilterChange }: ColumnFilterDropdownProps) {
  const { t } = useTranslation("tasks");

  const label = selectedColumnIds.length === 0
    ? t("allColumns")
    : t("columnCount", { count: selectedColumnIds.length });

  const toggleColumn = (columnId: string) => {
    const next = selectedColumnIds.includes(columnId)
      ? selectedColumnIds.filter((id) => id !== columnId)
      : [...selectedColumnIds, columnId];
    onColumnFilterChange(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="btn btn-default">
          <Columns3 size={14} />
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={selectedColumnIds.includes(col.id)}
            onCheckedChange={() => toggleColumn(col.id)}
            onSelect={(e) => e.preventDefault()}
          >
            {col.title || t("untitled")}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onColumnFilterChange(columns.map((c) => c.id))}>
          {t("selectAllColumns")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onColumnFilterChange([])}>
          {t("selectNoColumns")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
