import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useManager } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import { openWorkspaceDoc } from "@/lib/workspace/workspace-clone";
import { extractCustomColorsFromTheme } from "@/lib/theme-definitions";
import { defaultCustomColors } from "@/types/theme";
import type { CustomThemeColors } from "@/types/theme";
import type { ThemeName } from "@/types/theme";

type ImportThemeFromWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (colors: CustomThemeColors) => void;
};

export function ImportThemeFromWorkspaceDialog({
  open,
  onOpenChange,
  onImport,
}: ImportThemeFromWorkspaceDialogProps) {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  const manager = useManager();
  const workspaces = useStore(manager.workspaces);
  const activeWorkspaceId = useStore(manager.activeWorkspaceId);
  const [loading, setLoading] = useState(false);

  const available = workspaces.filter((w) => w.workspaceId !== activeWorkspaceId);

  const handleSelect = async (workspaceId: string, databaseName: string) => {
    setLoading(true);
    try {
      const { workspace, repo } = await openWorkspaceDoc(workspaceId, databaseName);
      const theme = workspace.theme;
      repo.shutdown();

      let colors: CustomThemeColors;
      if (theme.theme !== "custom") {
        colors = extractCustomColorsFromTheme(theme.theme as Exclude<ThemeName, "custom">);
      } else if (theme.customColors) {
        colors = { ...theme.customColors };
      } else {
        colors = { ...defaultCustomColors };
      }

      onImport(colors);
      onOpenChange(false);
    } catch {
      // If reading fails, just close loading state — user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importFromWorkspaceTitle")}</DialogTitle>
          <DialogDescription>{t("importFromWorkspaceDescription")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={24} className="animate-spin text-[var(--accent-purple)]" />
          </div>
        ) : available.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">{t("noOtherWorkspaces")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {available.map((ws) => (
              <button
                key={ws.workspaceId}
                onClick={() => handleSelect(ws.workspaceId, ws.databaseName)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] text-left transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)] cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{ws.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <button className="btn btn-outline" onClick={() => onOpenChange(false)}>
            {tc("cancelButton")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
