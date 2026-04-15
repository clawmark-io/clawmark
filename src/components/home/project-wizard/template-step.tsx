import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PROJECT_TEMPLATES } from "@/lib/workspace/project-templates.ts";
import type { ProjectTemplate } from "@/lib/workspace/project-templates.ts";

const TEMPLATE_NAME_KEYS = {
  "simple-kanban": "templateSimpleKanban",
  "sdlc-kanban": "templateSdlcKanban",
} as const;

const TEMPLATE_DESCRIPTION_KEYS = {
  "simple-kanban": "templateSimpleKanbanDescription",
  "sdlc-kanban": "templateSdlcKanbanDescription",
} as const;

type TemplateStepProps = {
  onBack: () => void;
  onCreate: (name: string, template: ProjectTemplate) => void;
};

export function TemplateStep({ onBack, onCreate }: TemplateStepProps) {
  const [selectedId, setSelectedId] = useState(PROJECT_TEMPLATES[0].id);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const template = PROJECT_TEMPLATES.find((tpl) => tpl.id === selectedId);
    if (!template) return;
    onCreate(trimmed, template);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("wizardFromTemplateTitle")}
        </DialogTitle>
        <DialogDescription>{t("wizardFromTemplatePrompt")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {PROJECT_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              name={template.id in TEMPLATE_NAME_KEYS ? t(TEMPLATE_NAME_KEYS[template.id as keyof typeof TEMPLATE_NAME_KEYS]) : template.name}
              description={template.id in TEMPLATE_DESCRIPTION_KEYS ? t(TEMPLATE_DESCRIPTION_KEYS[template.id as keyof typeof TEMPLATE_DESCRIPTION_KEYS]) : template.description}
              selected={selectedId === template.id}
              onSelect={() => setSelectedId(template.id)}
            />
          ))}
        </div>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("projectNamePlaceholder")}
          autoFocus
        />
        <DialogFooter>
          <button type="button" className="btn btn-outline" onClick={onBack}>{tc("cancelButton")}</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{tc("createButton")}</button>
        </DialogFooter>
      </form>
    </>
  );
}

type TemplateCardProps = {
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
};

function TemplateCard({ name, description, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-0.5 px-4 py-3 rounded-lg border text-left transition-colors ${
        selected
          ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]/10"
          : "border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)]"
      }`}
    >
      <span className="text-sm font-medium">{name}</span>
      <span className="text-sm text-[var(--text-muted)]">{description}</span>
    </button>
  );
}
