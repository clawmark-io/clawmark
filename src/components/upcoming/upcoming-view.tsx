import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/stores/workspace-context";
import { collectUpcomingTasks, groupByBucket, filterByMode, BUCKET_CONFIG } from "@/lib/upcoming-utils";
import type { UpcomingTask, UpcomingFilterMode } from "@/lib/upcoming-utils";
import type { Tag, Workspace } from "@/types/data-model";
import { UpcomingToolbar } from "./upcoming-toolbar";
import { UpcomingSection } from "./upcoming-section";
import { UpcomingEmptyState } from "./upcoming-empty-state";
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";

function aggregateProjectTags(workspace: Workspace): Tag[] {
  const seen = new Map<string, Tag>();
  for (const project of Object.values(workspace.projects)) {
    for (const tag of project.tags ?? []) {
      if (!seen.has(tag.label.toLowerCase())) {
        seen.set(tag.label.toLowerCase(), tag);
      }
    }
  }
  return Array.from(seen.values());
}

function filterUpcomingTasks(
  tasks: UpcomingTask[],
  searchQuery: string,
  projectFilter: string | null,
  showSnoozed: boolean,
  selectedTagLabels: string[],
  workspace: Workspace,
): UpcomingTask[] {
  const now = Date.now();
  return tasks.filter((item) => {
    if (!showSnoozed && item.task.snoozeUntil !== null && item.task.snoozeUntil > now) return false;
    if (projectFilter && item.projectId !== projectFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.task.title.toLowerCase().includes(query)) return false;
    }
    if (selectedTagLabels.length > 0) {
      const project = workspace.projects[item.projectId];
      const projectTags = project?.tags ?? [];
      if (
        !selectedTagLabels.every((label) => {
          const projectTag = projectTags.find(
            (t) => t.label.toLowerCase() === label.toLowerCase(),
          );
          return projectTag ? item.task.tags.includes(projectTag.id) : false;
        })
      ) {
        return false;
      }
    }
    return true;
  });
}

export function UpcomingView() {
  const { workspace, workspaceId } = useWorkspace();
  const navigate = useNavigate();
  const { t } = useTranslation("tasks");

  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<UpcomingFilterMode>("show-upcoming");

  const aggregatedTags = useMemo(() => {
    if (!workspace) return [];
    return aggregateProjectTags(workspace);
  }, [workspace]);

  const selectedTagLabels = useMemo(() => {
    return selectedTagIds
      .map((id) => aggregatedTags.find((tag) => tag.id === id)?.label)
      .filter((l): l is string => l !== undefined);
  }, [selectedTagIds, aggregatedTags]);

  const allUpcoming = useMemo(() => {
    if (!workspace) return [];
    return collectUpcomingTasks(workspace);
  }, [workspace]);

  const filtered = useMemo(
    () => {
      const base = filterUpcomingTasks(allUpcoming, searchQuery, projectFilter, showSnoozed, selectedTagLabels, workspace!);
      return filterByMode(base, filterMode);
    },
    [allUpcoming, searchQuery, projectFilter, showSnoozed, selectedTagLabels, workspace, filterMode],
  );

  const grouped = useMemo(() => groupByBucket(filtered), [filtered]);

  const projects = useMemo(() => {
    if (!workspace) return [];
    return Object.values(workspace.projects)
      .toSorted((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({ id: p.id, title: p.title }));
  }, [workspace]);

  const handleTaskClick = (item: UpcomingTask) => {
    navigate({ to: '/w/$workspaceId/p/$projectId/tasks/$taskId', params: { workspaceId: workspaceId!, projectId: item.projectId, taskId: item.task.id } });
  };

  if (allUpcoming.length === 0) {
    return (
      <div className="max-w-[900px]">
        <div className="flex items-center gap-2 mb-6">
        <SidebarToggle />
        <h1 className="text-2xl font-semibold">{t("viewTitleUpcoming", { ns: "common", workspaceName: workspace?.name })}</h1>
      </div>
        <UpcomingEmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center gap-2 mb-6">
        <SidebarToggle />
        <h1 className="text-2xl font-semibold">{t("viewTitleUpcoming", { ns: "common", workspaceName: workspace?.name })}</h1>
      </div>
      <UpcomingToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTagIds={selectedTagIds}
        onTagsChange={setSelectedTagIds}
        projectTags={aggregatedTags}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        projects={projects}
        taskCount={filtered.length}
        showSnoozed={showSnoozed}
        onShowSnoozedChange={setShowSnoozed}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
      />
      <div className="flex flex-col gap-6 mt-4">
        {BUCKET_CONFIG.map(({ bucket, label }) => {
          const items = grouped.get(bucket);
          return items ? (
            <UpcomingSection
              key={bucket}
              label={t(label)}
              tasks={items}
              onTaskClick={handleTaskClick}
              isPastDue={bucket === "past-due"}
            />
          ) : null;
        })}
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-placeholder)]">
            {t("noMatchingTasks", { ns: "common" })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
