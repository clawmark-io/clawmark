import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { CloneSelectProjectsStep, CloneConfigureStep } from "./clone-workspace-steps";
import type { WorkspaceListEntry } from "@/lib/workspace/drivers/types";

type CloneWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceEntry: WorkspaceListEntry;
};

type Step =
  | { type: "select-projects" }
  | { type: "configure"; selectedProjectIds: string[] };

export function CloneWorkspaceDialog({ open, onOpenChange, sourceEntry }: CloneWorkspaceDialogProps) {
  const [step, setStep] = useState<Step>({ type: "select-projects" });

  // Reset to first step when dialog opens
  useEffect(() => {
    if (open) setStep({ type: "select-projects" });
  }, [open]);

  const handleClose = () => onOpenChange(false);

  const renderStep = () => {
    switch (step.type) {
      case "select-projects":
        return (
          <CloneSelectProjectsStep
            sourceEntry={sourceEntry}
            onBack={handleClose}
            onNext={(selectedIds) => setStep({ type: "configure", selectedProjectIds: selectedIds })}
          />
        );
      case "configure":
        return (
          <CloneConfigureStep
            sourceEntry={sourceEntry}
            selectedProjectIds={step.selectedProjectIds}
            onBack={() => setStep({ type: "select-projects" })}
            onDone={handleClose}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
