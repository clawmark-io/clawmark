import { create } from "zustand";

export type CreateProjectModalState = {
    visible: boolean;
    showCreateProject: () => void;
    hideCreateProject: () => void;
};

export const useCreateProjectModalState = create<CreateProjectModalState>((set) => ({
    visible: false,

    showCreateProject: () => set({ visible: true }),
    hideCreateProject: () => set({ visible: false }),
}));
