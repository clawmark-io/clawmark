import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/stores/workspace-context";
import { SyncTabContent } from "./sync-tab-content";
import { ImportTabContent } from "./import-tab-content";
import { ExportTabContent } from "./export-tab-content";
import { CardTabButton } from '@/components/ui/card-tab-button.tsx';
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";

type SyncTab = "sync" | "import" | "export";

function WorkspaceStats() {
  const { t } = useTranslation("common");
  const { workspace } = useWorkspace();
  if (!workspace) return null;

  const projects = Object.values(workspace.projects);
  const totalTasks = projects.reduce(
    (sum, p) => sum + Object.keys(p.tasks).length,
    0,
  );

  return (
    <p className="text-sm text-[var(--text-muted)]">
      {t("projectCount", { count: projects.length })}, {t("taskCount", { count: totalTasks })}
    </p>
  );
}

export function SyncView({ initialTab }: { initialTab?: string }) {
  const { t } = useTranslation("sync");
  const [activeTab, setActiveTab] = useState<SyncTab>(
    initialTab === "import" ? "import" : initialTab === "export" ? "export" : "sync"
  );

  const tabs: { value: SyncTab; label: string }[] = [
    { value: "sync", label: t("syncTab") },
    { value: "import", label: t("importTab") },
    { value: "export", label: t("exportTab") },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <SidebarToggle />
          <h2 className="text-lg font-semibold">{t("syncAndData")}</h2>
        </div>
        <WorkspaceStats />
      </div>

      <div className='card card-border bg-base-100'>

      <div className="flex gap-1 border-b border-[var(--border-subtle)]  px-4 pt-2">
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
        {activeTab === "sync" ? (
          <SyncTabContent />
        ) : activeTab === "import" ? (
          <ImportTabContent />
        ) : (
          <ExportTabContent />
        )}
      </div>
      </div>
    </div>
  );
}
