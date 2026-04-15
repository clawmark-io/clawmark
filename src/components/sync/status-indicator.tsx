import { useTranslation } from "react-i18next";
import type { SyncConnectionStatus } from "@/types/sync";

function statusColor(status: SyncConnectionStatus): string {
  switch (status) {
    case "connected": return "bg-success";
    case "connecting": return "bg-warning";
    case "syncing": return "bg-info";
    case "error": return "bg-error";
    case "disconnected": return "bg-base-300";
  }
}

export function StatusIndicator({ status }: { status: SyncConnectionStatus }) {
  const { t } = useTranslation("sync");

  const statusLabelMap: Record<SyncConnectionStatus, string> = {
    connected: t("connected"),
    connecting: t("connecting"),
    syncing: t("syncing"),
    error: t("error"),
    disconnected: t("disconnected"),
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block size-2 rounded-full ${statusColor(status)}`} />
      <span className="text-xs text-[var(--text-muted)]">{statusLabelMap[status]}</span>
    </div>
  );
}
