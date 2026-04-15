import {useRef} from "react";
import {useTranslation} from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import {useWorkspace} from "@/stores/workspace-context";
import { addProject } from "@/lib/workspace/actions/projects/add-project";
import {useCreateProjectModalState} from "@/stores/create-project.ts";


export function CreateProjectDialog() {
    const {t} = useTranslation("projects");
    const {hideCreateProject, visible} = useCreateProjectModalState();
    const inputRef = useRef<HTMLInputElement>(null);
    const {handle, workspaceId} = useWorkspace();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const title = inputRef.current?.value.trim();
        if (!title || !handle) return;

        const projectId = addProject(handle, title);
        if (projectId) {
            navigate({ to: "/w/$workspaceId/p/$projectId/kanban", params: { workspaceId, projectId } });
        }
        onOpenChange(false);
    };

    const onOpenChange = (status: boolean) => {
        if (!status) {
            hideCreateProject();
        }
    }

    return (
        <Dialog open={visible} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("newProject")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <Input
                        ref={inputRef}
                        placeholder={t("projectNamePlaceholder")}
                        autoFocus
                    />
                    <DialogFooter className="mt-4">
                        <button type="submit" className="btn btn-primary">{t("createButton", { ns: "common" })}</button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
