import { generateId } from "@/lib/utils/id";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field-label";
import { useWorkspaceClient } from "@/stores/manager-context";
import { SyncServerForm, defaultSyncServerFormValues, isSyncServerFormValid } from "./sync-server-form";
import type { SyncServerFormValues } from "./sync-server-form";
import type { SyncServerConfig, SyncMode } from "@/types/sync";

type AddServerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: SyncServerConfig | null;
};

export function AddServerDialog({ open, onOpenChange, server }: AddServerDialogProps) {
  const { t } = useTranslation("sync");
  const { t: tc } = useTranslation("common");
  const client = useWorkspaceClient();

  const [formValues, setFormValues] = useState<SyncServerFormValues>(defaultSyncServerFormValues);
  const [syncMode, setSyncMode] = useState<SyncMode>("automatic");

  const isEditing = server !== null;

  useEffect(() => {
    if (open) {
      if (server) {
        setFormValues({
          name: server.name,
          host: server.host,
          port: server.port,
          useTls: server.useTls,
          accessToken: server.accessToken,
        });
        setSyncMode(server.syncMode);
      } else {
        setFormValues(defaultSyncServerFormValues);
        setSyncMode("automatic");
      }
    }
  }, [open, server]);

  const isValid = isSyncServerFormValid(formValues);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const config: SyncServerConfig = {
      id: server?.id ?? generateId(),
      name: formValues.name.trim(),
      host: formValues.host.trim(),
      port: formValues.port,
      useTls: formValues.useTls,
      accessToken: formValues.accessToken.trim(),
      syncMode,
    };

    if (isEditing) {
      client.disconnectServer(config.id);
      client.updateServer(config.id, config);
    } else {
      client.addServer(config);
    }

    if (config.syncMode === "automatic") {
      client.connectServer(config);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEditing ? "editSyncServer" : "addSyncServer")}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("updateSyncServerDescription")
              : t("configureSyncServer")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <SyncServerForm values={formValues} onChange={setFormValues} />

          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("syncMode")}</FieldLabel>
            <select
              className="select select-bordered select-sm bg-base-200"
              value={syncMode}
              onChange={(e) => setSyncMode(e.target.value as SyncMode)}
            >
              <option value="automatic">{t("automatic")}</option>
              <option value="manual">{t("manual")}</option>
            </select>
            <span className="text-xs text-[var(--text-muted)]">
              {syncMode === "automatic"
                ? t("automaticDescription")
                : t("manualDescription")}
            </span>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onOpenChange(false)}
            >
              {tc("cancelButton")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid}
            >
              {isEditing ? tc("saveButton") : t("addServer")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
