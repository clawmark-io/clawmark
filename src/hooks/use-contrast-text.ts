import { isDarkBackground } from "@/lib/utils/color-contrast.ts";

/**
 * Given a background color (hex), returns contrast info and a CSS class
 * for readable text over that background.
 *
 * Uses `contrast-text-light` / `contrast-text-dark` classes defined in
 * index.css, which resolve to theme-appropriate light/dark text colors.
 *
 * Returns empty textClass when no background color is set (no override needed).
 */
export function useContrastText(backgroundColor: string | null) {
  if (!backgroundColor) {
    return { isDark: false, isLight: true, textClass: "" };
  }

  const isDark = isDarkBackground(backgroundColor);

  return {
    isDark,
    isLight: !isDark,
    textClass: isDark ? "contrast-text-light" : "contrast-text-dark",
  };
}
