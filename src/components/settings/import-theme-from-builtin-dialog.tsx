import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getThemePreviewColors, extractCustomColorsFromTheme } from "@/lib/theme-definitions";
import type { BuiltInThemeName } from "@/lib/theme-definitions";
import type { CustomThemeColors } from "@/types/theme";
import "../settings/theme-selector.css";

type ImportThemeFromBuiltinDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (colors: CustomThemeColors) => void;
};

export function ImportThemeFromBuiltinDialog({
  open,
  onOpenChange,
  onImport,
}: ImportThemeFromBuiltinDialogProps) {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");

  const themes: { value: BuiltInThemeName; label: string }[] = useMemo(() => [
    { value: "light", label: t("themeLight") },
    { value: "dark", label: t("themeDark") },
    { value: "darkish", label: t("themeDarkish") },
    { value: "alternative-light", label: t("themeAltLight") },
  ], [t]);

  const handleSelect = (themeName: BuiltInThemeName) => {
    const colors = extractCustomColorsFromTheme(themeName);
    onImport(colors);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importFromBuiltinTitle")}</DialogTitle>
          <DialogDescription>{t("importFromBuiltinDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((theme) => {
            const colors = getThemePreviewColors(theme.value);
            return (
              <button
                key={theme.value}
                onClick={() => handleSelect(theme.value)}
                className="flex flex-col gap-2 p-2 rounded-lg border border-[var(--border-subtle)] bg-transparent cursor-pointer transition-all duration-150 text-left hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)]"
              >
                <div className="theme-preview" style={{ background: colors.bg }}>
                  <div className="theme-preview-sidebar" style={{ background: colors.surface }}>
                    <div className="theme-preview-dot" style={{ background: colors.accent }} />
                    <div className="theme-preview-line" style={{ background: colors.text, opacity: 0.2 }} />
                    <div className="theme-preview-line" style={{ background: colors.text, opacity: 0.2 }} />
                  </div>
                  <div className="theme-preview-content">
                    <div className="theme-preview-header" style={{ background: colors.text, opacity: 0.15 }} />
                    <div className="theme-preview-card" style={{ background: colors.surface }}>
                      <div className="theme-preview-card-line" style={{ background: colors.text, opacity: 0.3 }} />
                      <div className="theme-preview-card-line short" style={{ background: colors.text, opacity: 0.15 }} />
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-sm">{theme.label}</span>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <button className="btn btn-outline" onClick={() => onOpenChange(false)}>
            {tc("cancelButton")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
