import { useState, useCallback } from "react";
import { processCsvFile, filenameWithoutExtension } from "@/lib/imports/csv-import";
import { useWorkspace } from "@/stores/workspace-context";
import type { ImportDialogState } from "@/components/sync/import-result-dialog";
import { renderCsvImportSummary } from "@/components/sync/import-summaries";
import { importProjects } from '@/lib/workspace/actions/import/import-projects.ts';

type CsvNamingState = { file: File; suggestedName: string };

export function useCsvImport() {
  const [state, setState] = useState<ImportDialogState>({ status: "idle" });
  const [naming, setNaming] = useState<CsvNamingState | null>(null);
  const { handle } = useWorkspace();

  const startImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      setNaming({ file, suggestedName: filenameWithoutExtension(file.name) });
    });

    input.click();
  }, []);

  const confirmImport = useCallback(async (projectName: string) => {
    if (!naming || !handle) return;
    const { file } = naming;
    setNaming(null);
    setState({ status: "importing" });

    const result = await processCsvFile(file, projectName);

    if (result.success) {
      importProjects(handle, [result.project]);
      setState({ status: "success", summary: renderCsvImportSummary(result.stats) });
    } else {
      setState({ status: "error", message: result.error });
    }
  }, [naming, handle]);

  const cancelNaming = useCallback(() => setNaming(null), []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, naming, startImport, confirmImport, cancelNaming, reset };
}
