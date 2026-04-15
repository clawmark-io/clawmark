import { create } from "zustand";

type ColumnSettingsState = {
  visible: boolean;
  projectId: string | null;
  columnId: string | null;
  showColumnSettings: (projectId: string, columnId: string) => void;
  hideColumnSettings: () => void;
};

export const useColumnSettingsState = create<ColumnSettingsState>((set) => ({
  visible: false,
  projectId: null,
  columnId: null,
  showColumnSettings: (projectId, columnId) =>
    set({ visible: true, projectId, columnId }),
  hideColumnSettings: () =>
    set({ visible: false, projectId: null, columnId: null }),
}));
