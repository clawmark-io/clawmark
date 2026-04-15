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
import { useWorkspace } from "@/stores/workspace-context";
import { deleteProject } from "@/lib/workspace/actions/projects/delete-project";
import { useDeleteProjectModalState } from "@/stores/delete-project";

export function DeleteProjectDialog() {
    const { t } = useTranslation("projects");
    const { visible, projectId, projectTitle, hideDeleteProject } =
        useDeleteProjectModalState();
    const { handle, workspaceId } = useWorkspace();
    const [confirmText, setConfirmText] = useState("");
    const [copied, setCopied] = useState(false);

    const matches = confirmText === projectTitle;

    const handleCopyName = useCallback(() => {
        if (!projectTitle) return;
        navigator.clipboard.writeText(projectTitle);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [projectTitle]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!matches || !projectId || !handle) return;

        deleteProject(handle, workspaceId, projectId);
        handleClose(false);
    };

    const handleClose = (status: boolean) => {
        if (!status) {
            setConfirmText("");
            setCopied(false);
            hideDeleteProject();
        }
    };

    return (
        <Dialog open={visible} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("deleteProject")}</DialogTitle>
                    <DialogDescription>
                        <Trans
                            i18nKey="typeToConfirm"
                            ns="common"
                            values={{ name: projectTitle }}
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
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={t("enterProjectName")}
                        autoFocus
                    />
                    <DialogFooter className="mt-4">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleClose(false)}
                        >
                            {t("cancelButton", { ns: "common" })}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-error"
                            disabled={!matches}
                        >
                            {t("deleteButton", { ns: "common" })}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
