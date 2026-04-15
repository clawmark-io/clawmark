import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ThemeSelector } from "./theme-selector";
import { CloudSyncSettings } from "./cloud-sync-settings";
import { useSettingsStore } from "@/stores/settings-store";
import { useWorkspace } from "@/stores/workspace-context";
import { updateWorkspaceName } from "@/lib/workspace/actions/theme/update-workspace-name";
import { updateDefaultView } from "@/lib/workspace/actions/theme/update-default-view";
import { FieldLabel } from "@/components/ui/field-label";
import { SectionHeader } from "@/components/ui/section-header";
import { CardTabButton } from "@/components/ui/card-tab-button";
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";
import type { WorkspaceDefaultView } from "@/types/data-model";

type SettingsTab = "general" | "look-and-feel" | "cloud-sync";

export function SettingsView({ initialTab }: { initialTab?: string }) {
  const { t } = useTranslation("settings");
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    initialTab === "cloud-sync" ? "cloud-sync" :
    initialTab === "look-and-feel" ? "look-and-feel" : "general"
  );

  const tabs: { value: SettingsTab; label: string }[] = [
    {value: "general", label: t("generalTab")},
    {value: "look-and-feel", label: t("lookAndFeelTab")},
    {value: "cloud-sync", label: t("cloudSyncTab")},
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <SidebarToggle />
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
      </div>

      <div className="card card-border bg-base-100">
        <div className="flex gap-1 border-b border-[var(--border-subtle)] px-4 pt-2">
          {tabs.map((tab) => (
            <CardTabButton
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              isActive={activeTab === tab.value}
            >
              {tab.label}
            </CardTabButton>
          ))}
        </div>

        <div className='card-body'>
          {activeTab === "general" ? (
            <GeneralSettings />
          ) : activeTab === "look-and-feel" ? (
            <LookAndFeelSettings />
          ) : (
            <CloudSyncSettings />
          )}
        </div>
      </div>
    </div>
  );
}

function WorkspaceNameField() {
  const { t } = useTranslation("settings");
  const { workspace, handle } = useWorkspace();
  const [name, setName] = useState(workspace?.name ?? "");

  const handleBlur = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== workspace?.name && handle) {
      updateWorkspaceName(handle, trimmed);
    } else {
      setName(workspace?.name ?? "");
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{t("workspaceName")}</FieldLabel>
      <input
        className="input input-bordered input-sm w-[240px] bg-[var(--surface-overlay)]"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
    </div>
  );
}

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pl", label: "Polski" },
];

function DefaultViewSelector() {
  const { t } = useTranslation("settings");
  const { workspace, handle } = useWorkspace();
  const currentValue: WorkspaceDefaultView = workspace?.defaultView ?? "projects";

  const handleChange = (value: WorkspaceDefaultView) => {
    if (handle) {
      updateDefaultView(handle, value);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{t("defaultView")}</FieldLabel>
      <select
        className="select select-bordered select-sm w-[240px] bg-base-200"
        value={currentValue}
        onChange={(e) => handleChange(e.target.value as WorkspaceDefaultView)}
        data-testid="default-view-selector"
      >
        <option value="projects">{t("defaultViewProjects")}</option>
        <option value="upcoming">{t("defaultViewUpcoming")}</option>
      </select>
      <span className="text-sm text-[var(--text-muted)]">
        {t("defaultViewHelp")}
      </span>
    </div>
  );
}

function GeneralSettings() {
  const { t } = useTranslation("settings");
  const {backgroundIntervalMinutes, setBackgroundIntervalMinutes} = useSettingsStore();

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader>{t("workspace")}</SectionHeader>
      <WorkspaceNameField />
      <DefaultViewSelector />

      <SectionHeader>{t("backgroundProcesses")}</SectionHeader>
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t("checkIntervalMinutes")}</FieldLabel>
        <input
          className="input input-bordered input-sm w-[100px] bg-[var(--surface-overlay)] text-center"
          type="number"
          min={1}
          value={backgroundIntervalMinutes}
          onChange={(e) => setBackgroundIntervalMinutes(parseInt(e.target.value) || 15)}
        />
        <span className="text-sm text-[var(--text-muted)]">
          {t("checkIntervalHelp")}
        </span>
      </div>

      <LanguageSelector />
    </div>
  );
}

function LanguageSelector() {
  const { t } = useTranslation("settings");
  const { language, setLanguage } = useSettingsStore();

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{t("language")}</FieldLabel>
      <select
        className="select select-bordered select-sm w-[240px] bg-base-200"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        data-testid="language-selector"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <span className="text-sm text-[var(--text-muted)]">
        {t("languageHelp")}
      </span>
    </div>
  );
}

function LookAndFeelSettings() {
  const { t } = useTranslation("settings");
  return (
    <div className="flex flex-col gap-3">
      <SectionHeader>{t("appearance")}</SectionHeader>
      <ThemeSelector/>
    </div>
  );
}
