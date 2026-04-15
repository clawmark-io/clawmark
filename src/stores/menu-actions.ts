import { create } from "zustand";

type MenuActionsState = {
  pendingNewWorkspace: boolean;
  requestNewWorkspace: () => void;
  clearNewWorkspaceRequest: () => void;
};

export const useMenuActionsStore = create<MenuActionsState>((set) => ({
  pendingNewWorkspace: false,
  requestNewWorkspace: () => set({ pendingNewWorkspace: true }),
  clearNewWorkspaceRequest: () => set({ pendingNewWorkspace: false }),
}));
