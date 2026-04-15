import { create } from "zustand";
import type { ThemeName, CustomThemeColors } from "@/types/theme";
import { defaultCustomColors } from "@/types/theme";

export type { ThemeName, CustomThemeColors };
export { defaultCustomColors };

type ThemeState = {
  currentTheme: ThemeName;
  customColors: CustomThemeColors;
  setTheme: (theme: ThemeName) => void;
  setCustomColor: (key: keyof CustomThemeColors, value: string) => void;
  setCustomColors: (colors: Partial<CustomThemeColors>) => void;
  resetCustomTheme: () => void;
};

export const useThemeStore = create<ThemeState>()(
  (set) => ({
    currentTheme: "dark",
    customColors: { ...defaultCustomColors },
    setTheme: (theme) => set({ currentTheme: theme }),
    setCustomColor: (key, value) =>
      set((state) => ({
        customColors: { ...state.customColors, [key]: value },
      })),
    setCustomColors: (colors) =>
      set((state) => ({
        customColors: { ...state.customColors, ...colors },
      })),
    resetCustomTheme: () =>
      set({ customColors: { ...defaultCustomColors } }),
  })
);
