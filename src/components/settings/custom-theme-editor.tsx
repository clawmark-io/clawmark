import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Palette, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/stores/theme-store";
import { useWorkspace } from "@/stores/workspace-context";
import { defaultCustomColors } from "@/types/theme";
import type { CustomThemeColors } from "@/types/theme";
import { oklchToHex } from "@/lib/utils/color-utils.ts";
import { FieldLabel } from '@/components/ui/field-label.tsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ImportThemeFromBuiltinDialog } from "./import-theme-from-builtin-dialog";
import { ImportThemeFromWorkspaceDialog } from "./import-theme-from-workspace-dialog";

type ColorField = {
  key: keyof CustomThemeColors;
  label: string;
  group: string;
};

const colorFields: ColorField[] = [
  { key: "--color-base-100", label: "Background", group: "Base" },
  { key: "--color-base-200", label: "Surface", group: "Base" },
  { key: "--color-base-300", label: "Border", group: "Base" },
  { key: "--color-base-content", label: "Text", group: "Base" },
  { key: "--color-primary", label: "Primary", group: "Accents" },
  { key: "--color-primary-content", label: "Primary Text", group: "Accents" },
  { key: "--color-accent", label: "Accent", group: "Accents" },
  { key: "--color-accent-content", label: "Accent Text", group: "Accents" },
  { key: "--color-secondary", label: "Secondary", group: "Accents" },
  { key: "--color-secondary-content", label: "Secondary Text", group: "Accents" },
  { key: "--color-success", label: "Success", group: "Status" },
  { key: "--color-warning", label: "Warning", group: "Status" },
  { key: "--color-error", label: "Error", group: "Status" },
  { key: "--color-info", label: "Info", group: "Status" },
  { key: "--accent-purple", label: "Brand Accent", group: "App" },
  { key: "--accent-purple-hover", label: "Brand Hover", group: "App" },
  { key: "--surface-overlay", label: "Overlay", group: "App" },
  { key: "--text-subtle", label: "Subtle Text", group: "App" },
  { key: "--text-muted", label: "Muted Text", group: "App" },
  { key: "--border-subtle", label: "Subtle Border", group: "App" },
  { key: "--border-default", label: "Default Border", group: "App" },
];

const groups = ["Base", "Accents", "Status", "App"];

type ColorFieldEditorProps = {
  colorKey: keyof CustomThemeColors;
  label: string;
  value: string;
  onChange: (key: keyof CustomThemeColors, value: string) => void;
};

function ColorFieldEditor({ colorKey, label, value, onChange }: ColorFieldEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onChange(colorKey, newValue);
    }, 100);
  }, [colorKey, onChange]);

  return (
    <div className="flex flex-col gap-0.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={oklchToHex(localValue)}
          onChange={(e) => handleChange(e.target.value)}
          className="w-6 h-6 border border-[var(--border-default)] rounded cursor-pointer p-0 bg-none shrink-0"
        />
        <input
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className="input input-bordered input-xs flex-1 min-w-0 text-xs font-mono"
          placeholder={defaultCustomColors[colorKey]}
        />
      </div>
    </div>
  );
}

export function CustomThemeEditor() {
  const { t } = useTranslation("settings");
  const customColors = useThemeStore((s) => s.customColors);
  const { updateCustomColors } = useWorkspace();
  const [builtinDialogOpen, setBuiltinDialogOpen] = useState(false);
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);

  const setCustomColor = useCallback((key: keyof CustomThemeColors, value: string) => {
    updateCustomColors({ ...customColors, [key]: value });
  }, [customColors, updateCustomColors]);

  const resetCustomTheme = () => {
    updateCustomColors({ ...defaultCustomColors });
  };

  const handleImport = (colors: CustomThemeColors) => {
    updateCustomColors(colors);
  };

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-[var(--surface-overlay)] border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">Custom Colors</span>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn btn-outline btn-xs">
                {t("importTheme")}
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setBuiltinDialogOpen(true)}>
                <Palette size={14} />
                {t("importFromBuiltinThemes")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setWorkspaceDialogOpen(true)}>
                <FolderOpen size={14} />
                {t("importFromOtherWorkspace")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="btn btn-error btn-outline btn-xs" onClick={resetCustomTheme}>
            Reset
          </button>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group} className="flex flex-col gap-1.5">
          <span className="font-semibold uppercase tracking-wider">{group}</span>
          <div className="grid grid-cols-2 gap-1.5">
            {colorFields
              .filter((f) => f.group === group)
              .map((field) => (
                <ColorFieldEditor
                  key={field.key}
                  colorKey={field.key}
                  label={field.label}
                  value={customColors[field.key]}
                  onChange={setCustomColor}
                />
              ))}
          </div>
        </div>
      ))}

      <ImportThemeFromBuiltinDialog
        open={builtinDialogOpen}
        onOpenChange={setBuiltinDialogOpen}
        onImport={handleImport}
      />
      <ImportThemeFromWorkspaceDialog
        open={workspaceDialogOpen}
        onOpenChange={setWorkspaceDialogOpen}
        onImport={handleImport}
      />
    </div>
  );
}
