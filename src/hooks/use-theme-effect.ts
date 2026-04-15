import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";
import { applyTheme } from "@/lib/theme-definitions";

export function useThemeEffect() {
  const { currentTheme, customColors } = useThemeStore();

  useEffect(() => {
    applyTheme(currentTheme, customColors);
  }, [currentTheme, customColors]);
}
