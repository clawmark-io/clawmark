import { useState, useCallback } from "react";
import { processKanriFile } from "@/lib/imports/kanri-import";
import { useWorkspace } from "@/stores/workspace-context";
import { useThemeStore } from "@/stores/theme-store";
import type { ImportDialogState } from "@/components/sync/import-result-dialog";
import { renderKanriImportSummary } from "@/components/sync/import-summaries";
import { importProjects } from '@/lib/workspace/actions/import/import-projects.ts';

export function useKanriImport() {
  const [state, setState] = useState<ImportDialogState>({ status: "idle" });
  const { handle, workspaceId } = useWorkspace();
  const setTheme = useThemeStore((s) => s.setTheme);

  const startImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file || !handle) return;

      setState({ status: "importing" });

      const result = await processKanriFile(workspaceId, file);

      if (result.success) {
        importProjects(handle, result.projects);
        if (result.suggestedTheme) {
          setTheme(result.suggestedTheme);
        }
        setState({ status: "success", summary: renderKanriImportSummary(result.stats) });
      } else {
        setState({ status: "error", message: result.error });
      }
    });

    input.click();
  }, [handle, setTheme, workspaceId]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, startImport, reset };
}
