import { useState, useEffect } from "react";

type ProjectNameFieldProps = {
  projectId: string;
  projectTitle: string;
  onUpdate: (projectId: string, updates: { title: string }) => void;
};

export function ProjectNameField({
  projectId,
  projectTitle,
  onUpdate,
}: ProjectNameFieldProps) {
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(projectTitle);

  useEffect(() => {
    if (!editingName) {
      setLocalName(projectTitle);
    }
  }, [projectTitle, editingName]);

  const handleNameBlur = () => {
    setEditingName(false);
    const trimmed = localName.trim();
    if (trimmed && trimmed !== projectTitle) {
      onUpdate(projectId, { title: trimmed });
    } else {
      setLocalName(projectTitle);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      setLocalName(projectTitle);
      setEditingName(false);
    }
  };

  if (editingName) {
    return (
      <input
        className="input input-bordered input-sm bg-[var(--surface-overlay)] w-full"
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={handleNameBlur}
        onKeyDown={handleNameKeyDown}
        autoFocus
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="py-2 px-3 rounded-lg border border-[var(--border-subtle)] text-sm cursor-text transition-colors duration-150 hover:border-[var(--border-default)]"
      onClick={() => setEditingName(true)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditingName(true); } }}
    >
      {projectTitle}
    </div>
  );
}
