import { create } from "zustand";

export type DeleteProjectModalState = {
    visible: boolean;
    projectId: string | null;
    projectTitle: string | null;
    showDeleteProject: (projectId: string, projectTitle: string) => void;
    hideDeleteProject: () => void;
};

export const useDeleteProjectModalState = create<DeleteProjectModalState>((set) => ({
    visible: false,
    projectId: null,
    projectTitle: null,

    showDeleteProject: (projectId: string, projectTitle: string) =>
        set({ visible: true, projectId, projectTitle }),
    hideDeleteProject: () =>
        set({ visible: false, projectId: null, projectTitle: null }),
}));
