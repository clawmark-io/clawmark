import { useRef, useState } from "react";
import { Plus, Tags } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FieldLabel } from "@/components/ui/field-label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagBadge } from "@/components/ui/tag-badge";
import { TagColorSwatch } from "@/components/project/tags-editor";
import { useWorkspace } from "@/stores/workspace-context";
import { updateTask } from "@/lib/workspace/actions/tasks/update-task";
import { addTag } from "@/lib/workspace/actions/tags/add-tag";
import { createTag } from "@/lib/data-model";
import type { Tag } from "@/types/data-model";

type TaskTagsSectionProps = {
  projectId: string;
  projectTags: Tag[];
  taskId: string;
  taskTagIds: string[];
};

export function TaskTagsSection({
  projectId,
  projectTags,
  taskId,
  taskTagIds,
}: TaskTagsSectionProps) {
  const { handle } = useWorkspace();
  const { t } = useTranslation("tasks");

  const assignedTags = projectTags.filter((tag) => taskTagIds.includes(tag.id));

  const handleRemove = (tagId: string) => {
    if (handle) updateTask(handle, projectId, taskId, {
      tags: taskTagIds.filter((id) => id !== tagId),
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center py-3 border-b border-[var(--border-subtle)]">
      <FieldLabel icon={Tags}>{t("tags")}</FieldLabel>
      {assignedTags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemove(tag.id)} />
      ))}
      <AddTagDropdown
        projectId={projectId}
        projectTags={projectTags}
        taskId={taskId}
        taskTagIds={taskTagIds}
      />
    </div>
  );
}

type AddTagDropdownProps = {
  projectId: string;
  projectTags: Tag[];
  taskId: string;
  taskTagIds: string[];
};

function AddTagDropdown({
  projectId,
  projectTags,
  taskId,
  taskTagIds,
}: AddTagDropdownProps) {
  const { handle } = useWorkspace();
  const { t } = useTranslation("tasks");
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const unassignedTags = projectTags.filter((tag) => !taskTagIds.includes(tag.id));

  const assignTag = (tagId: string) => {
    if (handle) updateTask(handle, projectId, taskId, { tags: [...taskTagIds, tagId] });
  };

  const handleCreate = () => {
    const label = newLabel.trim();
    if (!label) return;
    const tag = createTag(label, "");
    if (handle) addTag(handle, projectId, tag);
    if (handle) updateTask(handle, projectId, taskId, { tags: [...taskTagIds, tag.id] });
    setNewLabel("");
    setCreating(false);
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
      document.execCommand("insertText", false, "-");
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      setNewLabel("");
      setCreating(false);
    }
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          setCreating(false);
          setNewLabel("");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button type="button" className="btn btn-ghost btn-xs gap-1">
          <Plus size={14} />
          {t("addTag")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {unassignedTags.map((tag) => (
          <DropdownMenuItem
            key={tag.id}
            onClick={() => assignTag(tag.id)}
          >
            <TagColorSwatch color={tag.color} />
            <span>#{tag.label}</span>
          </DropdownMenuItem>
        ))}
        {unassignedTags.length > 0 ? <DropdownMenuSeparator /> : null}
        {creating ? (
          <div className="px-2 py-1.5">
            <input
              ref={inputRef}
              type="text"
              className="input input-bordered input-xs w-full"
              placeholder={t("tagNamePlaceholder")}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={() => {
                if (newLabel.trim()) {
                  handleCreate();
                } else {
                  setCreating(false);
                }
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-base-200 cursor-pointer"
            onClick={() => setCreating(true)}
          >
            <Plus size={14} />
            {t("createTag")}
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
