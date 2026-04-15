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
import { DEFAULT_CLONE_OPTIONS } from "@/lib/workspace/project-clone.ts";
import type { CloneOptions } from "@/lib/workspace/project-clone.ts";

type CloneOptionsStepProps = {
  sourceProjectTitle: string;
  onBack: () => void;
  onClone: (name: string, options: CloneOptions) => void;
};

const OPTION_ENTRIES = [
  { key: "columns", labelKey: "columns" },
  { key: "tags", labelKey: "tags" },
  { key: "openTasks", labelKey: "wizardOpenTasks" },
  { key: "completedTasks", labelKey: "wizardCompletedTasks" },
  { key: "visualSettings", labelKey: "wizardVisualSettings" },
] as const satisfies readonly { key: keyof CloneOptions; labelKey: string }[];

export function CloneOptionsStep({ sourceProjectTitle, onBack, onClone }: CloneOptionsStepProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");
  const [name, setName] = useState(t("wizardCopyNameSuffix", { name: sourceProjectTitle }));
  const [options, setOptions] = useState<CloneOptions>({ ...DEFAULT_CLONE_OPTIONS });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.select(), 50);
  }, []);

  const toggleOption = (key: keyof CloneOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onClone(trimmed, options);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("wizardCloneOptionsTitle")}
        </DialogTitle>
        <DialogDescription>{t("wizardCloneOptionsPrompt")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("projectNamePlaceholder")}
          autoFocus
        />
        <div className="flex flex-col gap-2">
          {OPTION_ENTRIES.map((entry) => (
            <CloneOptionCheckbox
              key={entry.key}
              label={t(entry.labelKey)}
              checked={options[entry.key]}
              onChange={() => toggleOption(entry.key)}
            />
          ))}
        </div>
        <DialogFooter>
          <button type="button" className="btn btn-outline" onClick={onBack}>{tc("cancelButton")}</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{t("wizardCloneButton")}</button>
        </DialogFooter>
      </form>
    </>
  );
}

type CloneOptionCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

function CloneOptionCheckbox({ label, checked, onChange }: CloneOptionCheckboxProps) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface-overlay)] transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox checkbox-sm"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
