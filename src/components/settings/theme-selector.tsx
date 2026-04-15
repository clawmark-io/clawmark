import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/stores/theme-store";
import { useWorkspace } from "@/stores/workspace-context";
import type { ThemeName } from "@/types/theme";
import { getThemePreviewColors } from "@/lib/theme-definitions";
import { CustomThemeEditor } from "./custom-theme-editor";
import "./theme-selector.css"; // theme preview miniature styles

export function ThemeSelector() {
  const { t } = useTranslation("settings");
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const { updateTheme } = useWorkspace();

  const themes: { value: ThemeName; label: string; description: string }[] = useMemo(() => [
    { value: "light", label: t("themeLight"), description: t("themeLightDescription") },
    { value: "dark", label: t("themeDark"), description: t("themeDarkDescription") },
    { value: "darkish", label: t("themeDarkish"), description: t("themeDarkishDescription") },
    {
      value: "alternative-light",
      label: t("themeAltLight"),
      description: t("themeAltLightDescription"),
    },
    { value: "custom", label: t("themeCustom"), description: t("themeCustomDescription") },
  ], [t]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.value}
            onClick={() => updateTheme(theme.value)}
            className={`flex flex-col gap-2 p-2 rounded-lg border border-[var(--border-subtle)] bg-transparent cursor-pointer transition-all duration-150 text-left hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)] ${
              currentTheme === theme.value
                ? "border-[var(--accent-purple)]! bg-[var(--surface-overlay)]"
                : ""
            }`}
          >
            <ThemePreview theme={theme.value} />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">
                {theme.label}
              </span>
              <span className="text-sm text-muted">
                {theme.description}
              </span>
            </div>
          </button>
        ))}
      </div>

      {currentTheme === "custom" && <CustomThemeEditor />}
    </div>
  );
}

function ThemePreview({ theme }: { theme: ThemeName }) {
  const customColors = useThemeStore((s) => s.customColors);
  const colors = getThemePreviewColors(theme, customColors);

  return (
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
  );
}
