import { useState, useCallback } from "react";
import { processJsonFile } from "@/lib/imports/json-import";
import { useWorkspace } from "@/stores/workspace-context";
import type { ImportDialogState } from "@/components/sync/import-result-dialog";
import { renderJsonImportSummary } from "@/components/sync/import-summaries";
import { importProjects } from '@/lib/workspace/actions/import/import-projects.ts';

export function useJsonImport() {
  const [state, setState] = useState<ImportDialogState>({ status: "idle" });
  const { handle, workspaceId } = useWorkspace();

  const startImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file || !handle) return;

      setState({ status: "importing" });

      const result = await processJsonFile(workspaceId, file);

      if (result.success) {
        importProjects(handle, result.projects);
        setState({ status: "success", summary: renderJsonImportSummary(result.stats) });
      } else {
        setState({ status: "error", message: result.error });
      }
    });

    input.click();
  }, [handle, workspaceId]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, startImport, reset };
}
