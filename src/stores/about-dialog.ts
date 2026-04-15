import { create } from "zustand";

type AboutDialogState = {
  isOpen: boolean;
  show: () => void;
  hide: () => void;
};

export const useAboutDialogState = create<AboutDialogState>((set) => ({
  isOpen: false,
  show: () => set({ isOpen: true }),
  hide: () => set({ isOpen: false }),
}));
