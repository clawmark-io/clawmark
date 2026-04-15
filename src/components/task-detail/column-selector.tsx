import { useTranslation } from "react-i18next";
import { Columns3 } from "lucide-react";
import { FieldLabel } from "@/components/ui/field-label";
import type { Column } from "@/types/data-model";

type ColumnSelectorProps = {
  columns: Column[];
  currentColumnId: string | null;
  onChange: (columnId: string) => void;
};

export function ColumnSelector({ columns, currentColumnId, onChange }: ColumnSelectorProps) {
  const { t } = useTranslation("tasks");
  const sorted = [...columns].toSorted((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <FieldLabel icon={Columns3}>{t("column")}</FieldLabel>
      <select
        className="select select-bordered no-focus-outline w-full"
        value={currentColumnId ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {sorted.map((col) => (
          <option key={col.id} value={col.id}>
            {col.title}
          </option>
        ))}
      </select>
    </div>
  );
}
