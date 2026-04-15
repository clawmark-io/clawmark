import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type ImportDialogState =
  | { status: "idle" }
  | { status: "importing" }
  | { status: "success"; summary: ReactNode }
  | { status: "error"; message: string };

type ImportResultDialogProps = {
  state: ImportDialogState;
  onClose: () => void;
};

function ImportingContent() {
  const { t } = useTranslation("sync");
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
      <p className="text-sm text-[var(--text-subtle)]">{t("importingData")}</p>
    </div>
  );
}

function SuccessContent({ state }: { state: Extract<ImportDialogState, { status: "success" }> }) {
  const { t } = useTranslation("sync");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={20} className="text-[var(--success-text)]" />
        <span className="text-sm font-medium">{t("importComplete")}</span>
      </div>
      {state.summary}
    </div>
  );
}

function ErrorContent({ state }: { state: Extract<ImportDialogState, { status: "error" }> }) {
  const { t } = useTranslation("sync");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <XCircle size={20} className="text-error" />
        <span className="text-sm font-medium">{t("importFailed")}</span>
      </div>
      <p className="text-sm text-[var(--text-muted)] break-words">{state.message}</p>
    </div>
  );
}

export function ImportResultDialog({ state, onClose }: ImportResultDialogProps) {
  const { t } = useTranslation("sync");
  const { t: tc } = useTranslation("common");
  const isOpen = state.status !== "idle";
  const isImporting = state.status === "importing";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isImporting) onClose();
      }}
    >
      <DialogContent showCloseButton={!isImporting}>
        <DialogHeader>
          <DialogTitle>
            {state.status === "importing"
              ? t("importingTitle")
              : state.status === "success"
                ? t("importResultTitle")
                : state.status === "error"
                  ? t("importErrorTitle")
                  : ""}
          </DialogTitle>
        </DialogHeader>

        {state.status === "importing" ? (
          <ImportingContent />
        ) : state.status === "success" ? (
          <SuccessContent state={state} />
        ) : state.status === "error" ? (
          <ErrorContent state={state} />
        ) : null}

        {!isImporting ? (
          <DialogFooter>
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              {tc("doneButton")}
            </button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
