import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import { DatePicker } from "./date-picker";
import { FieldLabel } from "@/components/ui/field-label";

type DueDateEditorProps = {
  dueDate: number | null;
  onUpdate: (dueDate: number | null) => void;
  className?: string;
};

export function DueDateEditor({ dueDate, onUpdate, className = "flex flex-col gap-2 py-3 border-b border-[var(--border-subtle)]" }: DueDateEditorProps) {
  const { t } = useTranslation("tasks");
  return (
    <div className={className}>
      <FieldLabel icon={Calendar}>{t("dueDate")}</FieldLabel>
      <DatePicker value={dueDate} onChange={onUpdate} />
    </div>
  );
}
