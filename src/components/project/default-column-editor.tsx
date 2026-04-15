import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { FieldLabel } from "@/components/ui/field-label";
import type { Project } from "@/types/data-model";

type DefaultColumnEditorProps = {
  project: Project;
  onColumnChange: (columnId: string) => void;
};

export function DefaultColumnEditor({
  project,
  onColumnChange,
}: DefaultColumnEditorProps) {
  const { t } = useTranslation("tasks");

  if (project.columns.length === 0) {
    return null;
  }

  const defaultColumn = project.columns.find(
    (c) => c.id === project.defaultColumnId
  );
  const sortedColumns = [...project.columns].toSorted(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const handleDefaultColumnChange = (columnId: string) => {
    onColumnChange(columnId);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{t("defaultColumn")}</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="btn btn-sm border border-base-content/20 bg-base-100 font-normal">
            {defaultColumn?.title || t("selectColumn")}
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {sortedColumns.map((column) => (
            <DropdownMenuItem
              key={column.id}
              onSelect={() => handleDefaultColumnChange(column.id)}
            >
              {column.title}
              {column.id === project.defaultColumnId ? ` ${t("currentColumnSuffix")}` : ''}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-sm text-muted">
        {t("defaultColumnDescription")}
      </p>
    </div>
  );
}
