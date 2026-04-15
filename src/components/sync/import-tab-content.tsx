import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useKanriImport } from "@/hooks/use-kanri-import";
import { useJsonImport } from "@/hooks/use-json-import";
import { useCsvImport } from "@/hooks/use-csv-import";
import { ImportResultDialog } from "./import-result-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ImportOption = {
  label: string;
  description: string;
  disabled?: boolean;
  onClick?: () => void;
};

type CsvProjectNameDialogProps = {
  open: boolean;
  suggestedName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

function CsvProjectNameDialog({ open, suggestedName, onConfirm, onCancel }: CsvProjectNameDialogProps) {
  const { t } = useTranslation("sync");
  const { t: tc } = useTranslation("common");
  const { t: tp } = useTranslation("projects");
  const [name, setName] = useState(suggestedName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(suggestedName);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, suggestedName]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("csvImportTitle")}</DialogTitle>
          <DialogDescription>{t("csvImportDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tp("projectName")}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
              {tc("cancelButton")}
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!name.trim()}>
              {tc("importButton")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportOptionRow({ label, description, disabled, onClick }: ImportOption) {
  const { t } = useTranslation("common");
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col gap-0.5 items-start px-4 py-3 rounded-lg border border-[var(--border-subtle)] text-left transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--border-subtle)] disabled:hover:bg-transparent cursor-pointer"
    >
      <span className="text-sm font-medium">
        {label}
        {disabled ? (
          <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">({t("comingSoon")})</span>
        ) : null}
      </span>
      <span className="text-sm text-mut">{description}</span>
    </button>
  );
}

export function ImportTabContent() {
  const { t } = useTranslation("sync");
  const kanri = useKanriImport();
  const json = useJsonImport();
  const csv = useCsvImport();

  const activeState =
    kanri.state.status !== "idle" ? kanri.state :
    json.state.status !== "idle" ? json.state :
    csv.state.status !== "idle" ? csv.state :
    { status: "idle" as const };

  const activeReset =
    kanri.state.status !== "idle" ? kanri.reset :
    json.state.status !== "idle" ? json.reset :
    csv.state.status !== "idle" ? csv.reset :
    () => {};

  const options: ImportOption[] = [
    {
      label: t("importFromJson"),
      description: t("importFromJsonDescription"),
      onClick: json.startImport,
    },
    {
      label: t("importFromKanri"),
      description: t("importFromKanriDescription"),
      onClick: kanri.startImport,
    },
    {
      label: t("importFromCsv"),
      description: t("importFromCsvDescription"),
      onClick: csv.startImport,
    },
    {
      label: t("importFromAsana"),
      description: t("importFromAsanaDescription"),
      disabled: true,
    },
    {
      label: t("importFromTrello"),
      description: t("importFromTrelloDescription"),
      disabled: true,
    },
    {
      label: t("importFromJira"),
      description: t("importFromJiraDescription"),
      disabled: true,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <ImportOptionRow key={option.label} {...option} />
        ))}
      </div>
      <CsvProjectNameDialog
        open={csv.naming !== null}
        suggestedName={csv.naming?.suggestedName ?? ""}
        onConfirm={csv.confirmImport}
        onCancel={csv.cancelNaming}
      />
      <ImportResultDialog state={activeState} onClose={activeReset} />
    </>
  );
}
