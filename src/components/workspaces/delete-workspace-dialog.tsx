import { useState, useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useManager } from "@/stores/manager-context";
import type { WorkspaceListEntry } from "@/lib/workspace/drivers/types";

type DeleteWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: WorkspaceListEntry;
};

export function DeleteWorkspaceDialog({ open, onOpenChange, entry }: DeleteWorkspaceDialogProps) {
  const { t } = useTranslation("projects");
  const manager = useManager();
  const [confirmText, setConfirmText] = useState("");
  const [copied, setCopied] = useState(false);
  const settings = manager.getWorkspaceLocalSettings(entry.workspaceId);
  const isSynced = settings.servers.length > 0;
  const matches = confirmText === entry.name;

  const handleCopyName = useCallback(() => {
    navigator.clipboard.writeText(entry.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [entry.name]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText("");
      setCopied(false);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matches) return;

    await manager.deleteWorkspace(entry.workspaceId);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteWorkspace")}</DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="typeToConfirm"
              ns="common"
              values={{ name: entry.name }}
              components={{
                strong: (
                  <strong
                    role="button"
                    tabIndex={0}
                    className="text-foreground cursor-pointer hover:underline inline-flex items-center gap-1"
                    onClick={handleCopyName}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCopyName(); }}
                  />
                ),
              }}
            />
            <button
              type="button"
              className="inline-flex items-center ml-1 text-muted-foreground hover:text-foreground align-middle"
              onClick={handleCopyName}
              aria-label={t("copyName", { ns: "common" })}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </DialogDescription>
          {isSynced ? (
            <p className="text-sm text-[var(--text-muted)] mt-2">
              {t("workspaceSyncedNote")}
            </p>
          ) : null}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t("enterWorkspaceName")}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <button type="button" className="btn btn-outline" onClick={() => handleClose(false)}>
              {t("cancelButton", { ns: "common" })}
            </button>
            <button type="submit" className="btn btn-error" disabled={!matches}>
              {t("deleteButton", { ns: "common" })}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
