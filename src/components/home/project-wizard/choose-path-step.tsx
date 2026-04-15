import type { ReactNode } from "react";
import { Plus, LayoutTemplate, Copy, Download, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type PathOption = {
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
};

function PathOptionRow({ icon, label, description, onClick }: PathOption) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-subtle)] text-left transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)] cursor-pointer"
    >
      <div className="shrink-0 text-[var(--text-muted)]">{icon}</div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-[var(--text-muted)]">{description}</span>
      </div>
    </button>
  );
}

type ChoosePathStepProps = {
  onCreateNew: () => void;
  onTemplate: () => void;
  onClone: () => void;
  onImportJson: () => void;
  onImportKanri: () => void;
  onCancel: () => void;
};

export function ChoosePathStep({
  onCreateNew,
  onTemplate,
  onClone,
  onImportJson,
  onImportKanri,
  onCancel,
}: ChoosePathStepProps) {
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("newProject")}</DialogTitle>
        <DialogDescription>{t("wizardChooseDescription")}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <PathOptionRow
          icon={<Plus size={18} />}
          label={t("wizardCreateNew")}
          description={t("wizardCreateNewDescription")}
          onClick={onCreateNew}
        />
        <PathOptionRow
          icon={<LayoutTemplate size={18} />}
          label={t("wizardFromTemplate")}
          description={t("wizardFromTemplateDescription")}
          onClick={onTemplate}
        />
        <PathOptionRow
          icon={<Copy size={18} />}
          label={t("wizardCloneExisting")}
          description={t("wizardCloneExistingDescription")}
          onClick={onClone}
        />
        <PathOptionRow
          icon={<Download size={18} />}
          label={t("wizardImportJson")}
          description={t("wizardImportJsonDescription")}
          onClick={onImportJson}
        />
        <PathOptionRow
          icon={<RefreshCw size={18} />}
          label={t("wizardImportKanri")}
          description={t("wizardImportKanriDescription")}
          onClick={onImportKanri}
        />
      </div>
      <DialogFooter>
        <button type="button" className="btn btn-outline" onClick={onCancel}>{tc("cancelButton")}</button>
      </DialogFooter>
    </>
  );
}
