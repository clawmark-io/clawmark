import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Merge, Tags } from "lucide-react";
import { useWorkspace } from "@/stores/workspace-context";
import { addTag } from "@/lib/workspace/actions/tags/add-tag";
import { updateTag } from "@/lib/workspace/actions/tags/update-tag";
import { deleteTag } from "@/lib/workspace/actions/tags/delete-tag";
import { mergeTags } from "@/lib/workspace/actions/tags/merge-tags";
import { createTag } from "@/lib/data-model";
import { ColorPicker } from "@/components/ui/color-picker";
import { FieldLabel } from "@/components/ui/field-label";
import { TagBadge } from "@/components/ui/tag-badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Project, Tag } from "@/types/data-model";

type TagsEditorProps = {
  projectId: string;
  project: Project;
};

export function TagsEditor({ projectId, project }: TagsEditorProps) {
  const { t } = useTranslation("projects");
  const { handle } = useWorkspace();
  const [newlyAddedTagId, setNewlyAddedTagId] = useState<string | null>(null);

  const handleAddTag = () => {
    if (!handle) return;
    const newTag = createTag("new-tag", "");
    addTag(handle, projectId, newTag);
    setNewlyAddedTagId(newTag.id);
  };

  const handleUpdateTag = (tagId: string, updates: Partial<Tag>) => {
    if (handle) updateTag(handle, projectId, tagId, updates);
  };

  const handleDeleteTag = (tagId: string) => {
    if (handle) deleteTag(handle, projectId, tagId);
  };

  const handleMerge = (sourceId: string, targetId: string) => {
    if (handle) mergeTags(handle, projectId, sourceId, targetId);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel icon={Tags}>{t("tags")}</FieldLabel>
      {project.tags.length > 0 ? (
        <div className="flex flex-col gap-2">
          {project.tags.map((tag) => (
            <TagRow
              key={tag.id}
              tag={tag}
              allTags={project.tags}
              initialEditing={tag.id === newlyAddedTagId}
              onUpdate={handleUpdateTag}
              onDelete={handleDeleteTag}
              onMerge={handleMerge}
              onEditingStart={() => setNewlyAddedTagId(null)}
            />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="btn btn-ghost btn-sm self-start"
        onClick={handleAddTag}
      >
        {t("addTag")}
      </button>
    </div>
  );
}

type TagRowProps = {
  tag: Tag;
  allTags: Tag[];
  initialEditing: boolean;
  onUpdate: (tagId: string, updates: Partial<Tag>) => void;
  onDelete: (tagId: string) => void;
  onMerge: (sourceId: string, targetId: string) => void;
  onEditingStart: () => void;
};

function TagRow({ tag, allTags, initialEditing, onUpdate, onDelete, onMerge, onEditingStart }: TagRowProps) {
  const { t } = useTranslation("projects");
  const [editingLabel, setEditingLabel] = useState(initialEditing);
  const [localLabel, setLocalLabel] = useState(tag.label);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialEditing) {
      onEditingStart();
    }
  }, [initialEditing, onEditingStart]);

  useEffect(() => {
    if (editingLabel && inputRef.current) {
      inputRef.current.select();
    }
  }, [editingLabel]);

  useEffect(() => {
    if (!editingLabel) {
      setLocalLabel(tag.label);
    }
  }, [tag.label, editingLabel]);

  const handleLabelBlur = () => {
    setEditingLabel(false);
    const trimmed = localLabel.trim();
    if (trimmed && trimmed !== tag.label) {
      onUpdate(tag.id, { label: trimmed });
    } else {
      setLocalLabel(tag.label);
    }
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      document.execCommand("insertText", false, "-");
    }
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      setLocalLabel(tag.label);
      setEditingLabel(false);
    }
  };

  const handleColorChange = (color: string | null) => {
    onUpdate(tag.id, { color: color ?? "" });
  };

  const mergeTargets = allTags.filter((tg) => tg.id !== tag.id);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <TagColorSwatch
          color={tag.color}
          onClick={() => setShowColorPicker(!showColorPicker)}
        />
        {editingLabel ? (
          <input
            ref={inputRef}
            className="input input-bordered input-sm bg-[var(--surface-overlay)] flex-1"
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            autoFocus
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            className="cursor-text flex-1"
            onClick={() => setEditingLabel(true)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditingLabel(true); } }}
          >
            <TagBadge tag={tag} />
          </div>
        )}
        {mergeTargets.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square"
                title={t("mergeIntoAnotherTag")}
              >
                <Merge size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {mergeTargets.map((target) => (
                <DropdownMenuItem
                  key={target.id}
                  onClick={() => onMerge(tag.id, target.id)}
                >
                  <TagColorSwatch color={target.color} />
                  <span>#{target.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square"
          onClick={() => onDelete(tag.id)}
          title={t("deleteTag")}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {showColorPicker ? (
        <div className="pl-7">
          <ColorPicker value={tag.color || null} onChange={handleColorChange} />
        </div>
      ) : null}
    </div>
  );
}

type TagColorSwatchProps = {
  color: string;
  onClick?: () => void;
};

export function TagColorSwatch({ color, onClick }: TagColorSwatchProps) {
  const { t } = useTranslation("projects");
  const bg = color || "var(--color-base-200)";
  const className = "w-5 h-5 rounded-full shrink-0 border border-[var(--border-subtle)]";

  if (onClick) {
    return (
      <button
        type="button"
        className={`${className} cursor-pointer`}
        style={{ background: bg }}
        onClick={onClick}
        title={t("changeColor")}
      />
    );
  }

  return (
    <span
      className={className}
      style={{ background: bg }}
    />
  );
}
