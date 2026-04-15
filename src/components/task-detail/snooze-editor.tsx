import { useTranslation } from "react-i18next";
import { AlarmClockOff, TriangleAlert } from "lucide-react";
import { DatePicker } from "./date-picker";
import { FieldLabel } from "@/components/ui/field-label";

type SnoozeEditorProps = {
  snoozeUntil: number | null;
  dueDate: number | null;
  onUpdate: (snoozeUntil: number | null) => void;
  className?: string;
};

export function SnoozeEditor({ snoozeUntil, dueDate, onUpdate, className = "flex flex-col gap-2 py-3 border-b border-[var(--border-subtle)]" }: SnoozeEditorProps) {
  const { t } = useTranslation("tasks");
  const showWarning = snoozeUntil !== null && dueDate !== null && snoozeUntil > dueDate;

  return (
    <div className={`${className} relative`}>
      <FieldLabel icon={AlarmClockOff}>{t("snoozeUntil")}</FieldLabel>
      <DatePicker value={snoozeUntil} onChange={onUpdate} />
      {showWarning ? (
        <p className="absolute top-full mt-1 flex items-center gap-1.5 text-xs text-[var(--warning-text)] whitespace-nowrap">
          <TriangleAlert size={12} className="shrink-0" />
          {t("snoozeDateWarning")}
        </p>
      ) : null}
    </div>
  );
}
