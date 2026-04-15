import { create } from "zustand";

type CommandPaletteMode = 'commands' | 'search-project' | 'search-workspace';

type CommandPaletteState = {
  visible: boolean;
  initialMode: CommandPaletteMode;
  show: (mode?: CommandPaletteMode) => void;
  hide: () => void;
};

export const useCommandPaletteState = create<CommandPaletteState>((set) => ({
  visible: false,
  initialMode: 'commands',

  show: (mode = 'commands') =>
    set({ visible: true, initialMode: mode }),

  hide: () =>
    set({ visible: false }),
}));
