import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, Settings } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWorkspace } from "@/stores/workspace-context";
import { updateProject as updateProjectAction } from "@/lib/workspace/actions/projects/update-project";
import { addColumn } from "@/lib/workspace/actions/columns/add-column";
import { reorderColumns } from "@/lib/workspace/actions/columns/reorder-columns";
import { useProjectImages } from "@/hooks/use-project-images";
import { useColumnSettingsState } from "@/stores/column-settings";
import { hasBackground as projectHasBackground } from "@/types/data-model";
import { Switch } from "@/components/ui/switch";
import { ImageDropZone } from "@/components/ui/image-drop-zone";
import { BackgroundPickerDialog } from "./background-picker-dialog";
import { ProjectBriefEditor } from "./project-brief-editor";
import { ProjectNameField } from "./project-name-field";
import { DefaultColumnEditor } from "./default-column-editor";
import { FieldLabel } from "@/components/ui/field-label";
import { SectionHeader } from "@/components/ui/section-header";
import { TagsEditor } from "./tags-editor";
import type { Project, Column, DueDateDisplayMode } from "@/types/data-model";
import { CardTabButton } from '@/components/ui/card-tab-button.tsx';

type ProjectSettingsProps = {
  projectId: string;
  project: Project;
};

type ProjectSettingsTab = "general" | "kanban" | "images";

export function ProjectSettings({ projectId, project }: ProjectSettingsProps) {
  const { t } = useTranslation("projects");
  const [activeTab, setActiveTab] = useState<ProjectSettingsTab>("general");

  const tabs: { value: ProjectSettingsTab; label: string }[] = [
    { value: "general", label: t("generalTab") },
    { value: "kanban", label: t("kanbanTab") },
    { value: "images", label: t("imagesTab") },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      <div className="card card-border bg-base-100">
        <div className="flex gap-1 border-b border-[var(--border-subtle)] px-4 pt-2">
          {tabs.map((tab) => (
            <CardTabButton
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              isActive={activeTab === tab.value}
            >
              {tab.label}
            </CardTabButton>
          ))}
        </div>

        <div className="card-body">
          {activeTab === "general" ? (
            <GeneralTab projectId={projectId} project={project} />
          ) : activeTab === "kanban" ? (
            <KanbanTab projectId={projectId} project={project} />
          ) : (
            <ImagesTab projectId={projectId} project={project} />
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralTab({ projectId, project }: ProjectSettingsProps) {
  const { t } = useTranslation("projects");
  const { handle } = useWorkspace();

  const updateProject = (id: string, updates: Partial<Project>) => {
    if (handle) updateProjectAction(handle, id, updates);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("projectName")}</FieldLabel>
        <ProjectNameField
          projectId={projectId}
          projectTitle={project.title}
          onUpdate={updateProject}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("projectBrief")}</FieldLabel>
        <ProjectBriefEditor
          projectId={projectId}
          description={project.description}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("dueDateDisplay")}</FieldLabel>
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="dueDateDisplayMode"
              value="date"
              checked={project.dueDateDisplayMode === "date"}
              onChange={(e) => updateProject(projectId, { dueDateDisplayMode: e.target.value as DueDateDisplayMode })}
            />
            <span>{t("showDate")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="dueDateDisplayMode"
              value="day"
              checked={project.dueDateDisplayMode === "day"}
              onChange={(e) => updateProject(projectId, { dueDateDisplayMode: e.target.value as DueDateDisplayMode })}
            />
            <span>{t("showDay")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="dueDateDisplayMode"
              value="time"
              checked={project.dueDateDisplayMode === "time"}
              onChange={(e) => updateProject(projectId, { dueDateDisplayMode: e.target.value as DueDateDisplayMode })}
            />
            <span>{t("showRemainingTime")}</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("autoArchive")}</FieldLabel>
        <div className="flex items-center gap-2">
          <Switch
            checked={project.autoArchive}
            onCheckedChange={(checked) => updateProject(projectId, {
              autoArchive: checked,
              autoArchiveDays: project.autoArchiveDays || 7,
            })}
          />
          <span className="text-sm">{t("autoArchiveCompleted")}</span>
        </div>
        {project.autoArchive ? (
          <div className="flex items-center gap-2 pl-2">
            <span className="text-xs text-[var(--text-muted)]">{t("after")}</span>
            <input
              className="input input-bordered input-xs w-[60px] bg-[var(--surface-overlay)] text-center text-sm"
              type="number"
              min={1}
              value={project.autoArchiveDays}
              onChange={(e) => updateProject(projectId, { autoArchiveDays: parseInt(e.target.value) || 7 })}
            />
            <span className="text-xs text-[var(--text-muted)]">{t("days")}</span>
          </div>
        ) : null}
      </div>

      <TagsEditor projectId={projectId} project={project} />
    </div>
  );
}

function KanbanTab({ projectId, project }: ProjectSettingsProps) {
  const { t } = useTranslation("projects");
  const { handle } = useWorkspace();
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedColumns = [...project.columns].toSorted((a, b) => a.sortOrder - b.sortOrder);

  const handleKanbanToggle = () => {
    if (handle) updateProjectAction(handle, projectId, { kanbanEnabled: !project.kanbanEnabled });
  };

  const handleDefaultColumnChange = (columnId: string) => {
    if (handle) updateProjectAction(handle, projectId, { defaultColumnId: columnId });
  };

  const handleAddColumn = () => {
    const trimmed = newColumnTitle.trim();
    if (!trimmed) return;
    if (handle) addColumn(handle, projectId, trimmed);
    setNewColumnTitle("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (handle) reorderColumns(handle, projectId, active.id as string, over.id as string);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("kanbanBoard")}</FieldLabel>
        <div className="flex items-center gap-2">
          <Switch
            checked={project.kanbanEnabled}
            onCheckedChange={handleKanbanToggle}
          />
          <span className="text-sm">{t("enableKanbanView")}</span>
        </div>
      </div>

      {project.kanbanEnabled ? (
        <DefaultColumnEditor
          project={project}
          onColumnChange={handleDefaultColumnChange}
        />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("newTaskInputOnTop")}</FieldLabel>
        <div className="flex items-center gap-2">
          <Switch
            checked={project.newTaskInputOnTop ?? false}
            onCheckedChange={(checked) => handle && updateProjectAction(handle, projectId, { newTaskInputOnTop: checked })}
          />
          <span className="text-sm">{t("newTaskInputOnTopDescription")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("columns")}</FieldLabel>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedColumns.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1">
              {sortedColumns.map((column) => (
                <SortableColumnRow
                  key={column.id}
                  column={column}
                  projectId={projectId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <form
          className="flex items-center gap-2 mt-1"
          onSubmit={(e) => { e.preventDefault(); handleAddColumn(); }}
        >
          <input
            className="input input-bordered input-sm bg-[var(--surface-overlay)] flex-1"
            type="text"
            placeholder={t("newColumnNamePlaceholder")}
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary">{t("addButton", { ns: "common" })}</button>
        </form>
      </div>
    </div>
  );
}

function SortableColumnRow({ column, projectId }: { column: Column; projectId: string }) {
  const { showColumnSettings } = useColumnSettingsState();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      className="group flex items-center gap-2 p-2 rounded-md bg-[var(--surface-overlay)] cursor-pointer transition-colors duration-150 hover:bg-[var(--surface-overlay-hover)]"
      onClick={() => showColumnSettings(projectId, column.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showColumnSettings(projectId, column.id); } }}
    >
      <div
        className="cursor-grab text-[var(--text-subtle)] flex items-center"
        {...attributes}
        {...listeners}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </div>
      {column.color ? (
        <div className="w-[3px] h-4 rounded-sm shrink-0" style={{ background: column.color }} />
      ) : null}
      {column.backgroundColor ? (
        <div className="w-4 h-4 rounded-full shrink-0 border border-[var(--border-subtle)]" style={{ background: column.backgroundColor }} />
      ) : null}
      <span className="flex-1 min-w-0 text-sm truncate">{column.title}</span>
      <Settings size={14} className="text-[var(--text-muted)] shrink-0" />
    </div>
  );
}

function ImagesTab({ projectId, project }: ProjectSettingsProps) {
  const { t } = useTranslation("projects");
  const { handle, workspaceId, workspace } = useWorkspace();

  const updateProject = (id: string, updates: Partial<Project>) => {
    if (handle) updateProjectAction(handle, id, updates);
  };

  const { backgroundUrl, logoUrl, uploadBackground, removeBackground, uploadLogo, removeLogo } = useProjectImages(
    workspaceId,
    projectId,
    project.backgroundVersion,
    project.logoVersion,
    workspace?.projects,
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);

  const handleLogoDrop = async (file: File) => {
    const { version, mimeType } = await uploadLogo(file);
    updateProject(projectId, { logoVersion: version, logoMimeType: mimeType });
  };

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { version, mimeType } = await uploadLogo(file);
    updateProject(projectId, { logoVersion: version, logoMimeType: mimeType });
    e.target.value = "";
  };

  const handleLogoRemove = async () => {
    await removeLogo();
    updateProject(projectId, { logoVersion: undefined, logoMimeType: undefined });
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleBackgroundDrop = async (file: File) => {
    const { version, mimeType } = await uploadBackground(file);
    updateProject(projectId, { backgroundVersion: version, backgroundMimeType: mimeType });
  };

  const handleBackgroundClick = () => {
    setBgPickerOpen(true);
  };

  const handleBackgroundRemove = async () => {
    await removeBackground();
    updateProject(projectId, {
      backgroundVersion: undefined,
      backgroundMimeType: undefined,
      backgroundBlur: 0,
      backgroundSepia: 0,
      backgroundGrayscale: 0,
      backgroundOpacity: 100,
    });
  };

  const handleSelectBackground = (fromProjectId: string) => {
    const fromProject = workspace?.projects[fromProjectId];
    if (!fromProject?.backgroundVersion) return;
    updateProject(projectId, {
      backgroundVersion: fromProject.backgroundVersion,
      backgroundMimeType: fromProject.backgroundMimeType,
    });
  };

  const handleUploadBackground = async (file: File) => {
    const { version, mimeType } = await uploadBackground(file);
    updateProject(projectId, { backgroundVersion: version, backgroundMimeType: mimeType });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex flex-col gap-1.5 flex-1">
          <FieldLabel>{t("logoImage")}</FieldLabel>
          <ImageDropZone
            imageUrl={logoUrl}
            onFileDrop={handleLogoDrop}
            onClick={handleLogoClick}
            onRemove={logoUrl ? handleLogoRemove : null}
            label={t("logo")}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.gif,.svg"
            className="hidden"
            onChange={handleLogoFileChange}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <FieldLabel>{t("backgroundImage")}</FieldLabel>
          <ImageDropZone
            imageUrl={backgroundUrl}
            onFileDrop={handleBackgroundDrop}
            onClick={handleBackgroundClick}
            onRemove={backgroundUrl ? handleBackgroundRemove : null}
            label={t("background")}
          />
        </div>
      </div>

      {projectHasBackground(project) ? (
        <BackgroundFilters projectId={projectId} project={project} />
      ) : null}

      <BackgroundPickerDialog
        open={bgPickerOpen}
        onOpenChange={setBgPickerOpen}
        currentProjectId={projectId}
        onSelectBackground={handleSelectBackground}
        onRemoveBackground={handleBackgroundRemove}
        onUploadBackground={handleUploadBackground}
      />
    </div>
  );
}


function BackgroundFilters({ projectId, project }: ProjectSettingsProps) {
  const { t } = useTranslation("projects");
  const { handle } = useWorkspace();

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader>{t("backgroundFilters")}</SectionHeader>
      <FilterSlider
        label={t("opacity")}
        value={project.backgroundOpacity ?? 100}
        min={0} max={100} step={5}
        unit="%"
        onChange={(v) => handle && updateProjectAction(handle, projectId, { backgroundOpacity: v })}
      />
      <FilterSlider
        label={t("blur")}
        value={project.backgroundBlur}
        min={0} max={30} step={1}
        unit="px"
        onChange={(v) => handle && updateProjectAction(handle, projectId, { backgroundBlur: v })}
      />
      <FilterSlider
        label={t("sepia")}
        value={project.backgroundSepia ?? 0}
        min={0} max={100} step={5}
        unit="%"
        onChange={(v) => handle && updateProjectAction(handle, projectId, { backgroundSepia: v })}
      />
      <FilterSlider
        label={t("grayscale")}
        value={project.backgroundGrayscale ?? 0}
        min={0} max={100} step={5}
        unit="%"
        onChange={(v) => handle && updateProjectAction(handle, projectId, { backgroundGrayscale: v })}
      />
    </div>
  );
}

function FilterSlider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocalValue(v);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(v), 50);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-[var(--text-muted)]">
          {localValue}{unit}
        </span>
      </div>
      <input
        type="range"
        className="range range-xs range-primary w-full"
        min={min} max={max} step={step}
        value={localValue}
        onChange={handleChange}
      />
    </div>
  );
}
