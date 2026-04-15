import { create } from "zustand";

type HelpDialogState = {
  isOpen: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
};

export const useHelpDialogState = create<HelpDialogState>((set) => ({
  isOpen: false,
  show: () => set({ isOpen: true }),
  hide: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
