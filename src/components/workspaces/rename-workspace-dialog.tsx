import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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

type RenameWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: WorkspaceListEntry;
};

export function RenameWorkspaceDialog({ open, onOpenChange, entry }: RenameWorkspaceDialogProps) {
  const { t } = useTranslation("projects");
  const [name, setName] = useState(entry.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const manager = useManager();

  useEffect(() => {
    if (open) {
      setName(entry.name);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, entry.name]);

  const handleRename = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    manager.renameWorkspace(entry.workspaceId, trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("renameWorkspace")}</DialogTitle>
          <DialogDescription>{t("renameWorkspaceDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("workspaceName")}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <button type="button" className="btn btn-outline" onClick={() => onOpenChange(false)}>
              {t("cancelButton", { ns: "common" })}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              {t("renameButton", { ns: "common" })}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
