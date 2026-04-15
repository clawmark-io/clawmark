import type { ThemeName, CustomThemeColors } from "@/types/theme";
import { defaultCustomColors } from "@/types/theme";
import { oklchToHex, isLightOklch } from "./utils/color-utils.ts";

// ---------------------------------------------------------------------------
// Theme variable type — every CSS custom property a theme sets
// ---------------------------------------------------------------------------

type ThemeVariables = {
  // daisyUI color variables
  "--color-base-100": string;
  "--color-base-200": string;
  "--color-base-300": string;
  "--color-base-content": string;
  "--color-primary": string;
  "--color-primary-content": string;
  "--color-secondary": string;
  "--color-secondary-content": string;
  "--color-accent": string;
  "--color-accent-content": string;
  "--color-neutral": string;
  "--color-neutral-content": string;
  "--color-info": string;
  "--color-info-content": string;
  "--color-success": string;
  "--color-success-content": string;
  "--color-warning": string;
  "--color-warning-content": string;
  "--color-error": string;
  "--color-error-content": string;
  // daisyUI design tokens
  "--radius-selector": string;
  "--radius-field": string;
  "--radius-box": string;
  "--border": string;
  "--depth": string;
  "--noise": string;
  // App-specific
  "--surface-overlay": string;
  "--surface-overlay-hover": string;
  "--text-subtle": string;
  "--text-muted": string;
  "--text-placeholder": string;
  "--border-subtle": string;
  "--border-default": string;
  "--border-strong": string;
  "--border-active": string;
  "--shadow-sm": string;
  "--shadow-md": string;
  "--accent-purple": string;
  "--accent-purple-hover": string;
  "--warning-bg": string;
  "--warning-text": string;
  "--danger-bg": string;
  "--danger-text": string;
  "--success-bg": string;
  "--success-text": string;
  "--focus-ring": string;
};

type ThemeDefinition = ThemeVariables & {
  colorScheme: "light" | "dark";
};

export type BuiltInThemeName = Exclude<ThemeName, "custom">;

// ---------------------------------------------------------------------------
// Built-in theme definitions (single source of truth)
// ---------------------------------------------------------------------------

const lightTheme: ThemeDefinition = {
  colorScheme: "light",
  // daisyUI colors
  "--color-base-100": "oklch(1 0 0)",
  "--color-base-200": "oklch(0.97 0 0)",
  "--color-base-300": "oklch(0.922 0 0)",
  "--color-base-content": "oklch(0.145 0 0)",
  "--color-primary": "oklch(0.205 0 0)",
  "--color-primary-content": "oklch(0.985 0 0)",
  "--color-secondary": "oklch(0.97 0 0)",
  "--color-secondary-content": "oklch(0.205 0 0)",
  "--color-accent": "oklch(0.488 0.243 264.376)",
  "--color-accent-content": "oklch(0.985 0 0)",
  "--color-neutral": "oklch(0.556 0 0)",
  "--color-neutral-content": "oklch(0.985 0 0)",
  "--color-info": "oklch(0.6 0.118 184.704)",
  "--color-info-content": "oklch(0.985 0 0)",
  "--color-success": "oklch(0.5 0.1 145)",
  "--color-success-content": "oklch(0.985 0 0)",
  "--color-warning": "oklch(0.75 0.12 55)",
  "--color-warning-content": "oklch(0.2 0 0)",
  "--color-error": "oklch(0.577 0.245 27.325)",
  "--color-error-content": "oklch(0.985 0 0)",
  // daisyUI design tokens
  "--radius-selector": "0.5rem",
  "--radius-field": "0.5rem",
  "--radius-box": "0.625rem",
  "--border": "1px",
  "--depth": "1",
  "--noise": "0",
  // App-specific
  "--surface-overlay": "oklch(0 0 0 / 3%)",
  "--surface-overlay-hover": "oklch(0 0 0 / 6%)",
  "--text-subtle": "oklch(0.45 0 0)",
  "--text-muted": "oklch(0.556 0 0)",
  "--text-placeholder": "oklch(0.65 0 0)",
  "--border-subtle": "oklch(0 0 0 / 6%)",
  "--border-default": "oklch(0 0 0 / 12%)",
  "--border-strong": "oklch(0 0 0 / 20%)",
  "--border-active": "oklch(0 0 0 / 40%)",
  "--shadow-sm": "oklch(0 0 0 / 8%)",
  "--shadow-md": "oklch(0 0 0 / 15%)",
  "--accent-purple": "oklch(0.45 0.15 260)",
  "--accent-purple-hover": "oklch(0.55 0.15 260)",
  "--warning-bg": "oklch(0.92 0.06 55)",
  "--warning-text": "oklch(0.5 0.12 55)",
  "--danger-bg": "oklch(0.95 0.08 15)",
  "--danger-text": "oklch(0.45 0.15 15)",
  "--success-bg": "oklch(0.92 0.06 145)",
  "--success-text": "oklch(0.45 0.1 145)",
  "--focus-ring": "oklch(0.5 0.15 260 / 40%)",
};

const darkTheme: ThemeDefinition = {
  colorScheme: "dark",
  "--color-base-100": "oklch(0.145 0 0)",
  "--color-base-200": "oklch(0.205 0 0)",
  "--color-base-300": "oklch(0.269 0 0)",
  "--color-base-content": "oklch(0.985 0 0)",
  "--color-primary": "oklch(0.922 0 0)",
  "--color-primary-content": "oklch(0.205 0 0)",
  "--color-secondary": "oklch(0.269 0 0)",
  "--color-secondary-content": "oklch(0.985 0 0)",
  "--color-accent": "oklch(0.488 0.243 264.376)",
  "--color-accent-content": "oklch(0.985 0 0)",
  "--color-neutral": "oklch(0.556 0 0)",
  "--color-neutral-content": "oklch(0.985 0 0)",
  "--color-info": "oklch(0.696 0.17 162.48)",
  "--color-info-content": "oklch(0.985 0 0)",
  "--color-success": "oklch(0.5 0.1 145)",
  "--color-success-content": "oklch(0.985 0 0)",
  "--color-warning": "oklch(0.85 0.12 55)",
  "--color-warning-content": "oklch(0.2 0 0)",
  "--color-error": "oklch(0.704 0.191 22.216)",
  "--color-error-content": "oklch(0.985 0 0)",
  "--radius-selector": "0.5rem",
  "--radius-field": "0.5rem",
  "--radius-box": "0.625rem",
  "--border": "1px",
  "--depth": "1",
  "--noise": "0",
  "--surface-overlay": "oklch(1 0 0 / 3%)",
  "--surface-overlay-hover": "oklch(1 0 0 / 6%)",
  "--text-subtle": "oklch(0.6 0 0)",
  "--text-muted": "oklch(0.5 0 0)",
  "--text-placeholder": "oklch(0.4 0 0)",
  "--border-subtle": "oklch(1 0 0 / 6%)",
  "--border-default": "oklch(1 0 0 / 12%)",
  "--border-strong": "oklch(1 0 0 / 20%)",
  "--border-active": "oklch(1 0 0 / 40%)",
  "--shadow-sm": "oklch(0 0 0 / 15%)",
  "--shadow-md": "oklch(0 0 0 / 30%)",
  "--accent-purple": "oklch(0.65 0.15 260)",
  "--accent-purple-hover": "oklch(0.75 0.15 260)",
  "--warning-bg": "oklch(0.4 0.12 20)",
  "--warning-text": "oklch(0.85 0.12 20)",
  "--danger-bg": "oklch(0.35 0.15 15)",
  "--danger-text": "oklch(0.9 0.15 15)",
  "--success-bg": "oklch(0.3 0.12 145)",
  "--success-text": "oklch(0.5 0.1 145)",
  "--focus-ring": "oklch(0.6 0.18 255 / 40%)",
};

const darkishTheme: ThemeDefinition = {
  colorScheme: "dark",
  "--color-base-100": "oklch(0.2 0.015 260)",
  "--color-base-200": "oklch(0.25 0.015 260)",
  "--color-base-300": "oklch(0.3 0.015 260)",
  "--color-base-content": "oklch(0.92 0 0)",
  "--color-primary": "oklch(0.75 0.12 260)",
  "--color-primary-content": "oklch(0.15 0 0)",
  "--color-secondary": "oklch(0.35 0.02 260)",
  "--color-secondary-content": "oklch(0.9 0 0)",
  "--color-accent": "oklch(0.65 0.18 300)",
  "--color-accent-content": "oklch(0.985 0 0)",
  "--color-neutral": "oklch(0.5 0.01 260)",
  "--color-neutral-content": "oklch(0.92 0 0)",
  "--color-info": "oklch(0.65 0.15 220)",
  "--color-info-content": "oklch(0.985 0 0)",
  "--color-success": "oklch(0.6 0.12 155)",
  "--color-success-content": "oklch(0.985 0 0)",
  "--color-warning": "oklch(0.8 0.12 70)",
  "--color-warning-content": "oklch(0.2 0 0)",
  "--color-error": "oklch(0.65 0.2 20)",
  "--color-error-content": "oklch(0.985 0 0)",
  "--radius-selector": "0.5rem",
  "--radius-field": "0.5rem",
  "--radius-box": "0.625rem",
  "--border": "1px",
  "--depth": "1",
  "--noise": "0",
  "--surface-overlay": "oklch(1 0 0 / 3%)",
  "--surface-overlay-hover": "oklch(1 0 0 / 6%)",
  "--text-subtle": "oklch(0.6 0.01 260)",
  "--text-muted": "oklch(0.5 0.01 260)",
  "--text-placeholder": "oklch(0.4 0.01 260)",
  "--border-subtle": "oklch(1 0 0 / 6%)",
  "--border-default": "oklch(1 0 0 / 12%)",
  "--border-strong": "oklch(1 0 0 / 20%)",
  "--border-active": "oklch(1 0 0 / 40%)",
  "--shadow-sm": "oklch(0 0 0 / 15%)",
  "--shadow-md": "oklch(0 0 0 / 30%)",
  "--accent-purple": "oklch(0.65 0.18 300)",
  "--accent-purple-hover": "oklch(0.75 0.18 300)",
  "--warning-bg": "oklch(0.35 0.1 20)",
  "--warning-text": "oklch(0.8 0.12 20)",
  "--danger-bg": "oklch(0.3 0.12 15)",
  "--danger-text": "oklch(0.85 0.15 15)",
  "--success-bg": "oklch(0.28 0.1 155)",
  "--success-text": "oklch(0.6 0.12 155)",
  "--focus-ring": "oklch(0.65 0.18 299.788 / 0.46)",
};

const alternativeLightTheme: ThemeDefinition = {
  colorScheme: "light",
  "--color-base-100": "oklch(0.92 0.01 80)",
  "--color-base-200": "oklch(0.88 0.01 80)",
  "--color-base-300": "oklch(0.84 0.01 80)",
  "--color-base-content": "oklch(0.25 0 0)",
  "--color-primary": "oklch(0.45 0.12 260)",
  "--color-primary-content": "oklch(0.985 0 0)",
  "--color-secondary": "oklch(0.82 0.02 80)",
  "--color-secondary-content": "oklch(0.25 0 0)",
  "--color-accent": "oklch(0.55 0.18 330)",
  "--color-accent-content": "oklch(0.985 0 0)",
  "--color-neutral": "oklch(0.5 0.01 80)",
  "--color-neutral-content": "oklch(0.92 0 0)",
  "--color-info": "oklch(0.6 0.118 184.704)",
  "--color-info-content": "oklch(0.985 0 0)",
  "--color-success": "oklch(0.55 0.12 145)",
  "--color-success-content": "oklch(0.985 0 0)",
  "--color-warning": "oklch(0.75 0.12 55)",
  "--color-warning-content": "oklch(0.2 0 0)",
  "--color-error": "oklch(0.577 0.245 27.325)",
  "--color-error-content": "oklch(0.985 0 0)",
  "--radius-selector": "0.5rem",
  "--radius-field": "0.5rem",
  "--radius-box": "0.625rem",
  "--border": "1px",
  "--depth": "1",
  "--noise": "0",
  "--surface-overlay": "oklch(0 0 0 / 3%)",
  "--surface-overlay-hover": "oklch(0 0 0 / 6%)",
  "--text-subtle": "oklch(0.45 0 0)",
  "--text-muted": "oklch(0.5 0 0)",
  "--text-placeholder": "oklch(0.6 0 0)",
  "--border-subtle": "oklch(0 0 0 / 6%)",
  "--border-default": "oklch(0 0 0 / 12%)",
  "--border-strong": "oklch(0 0 0 / 20%)",
  "--border-active": "oklch(0 0 0 / 40%)",
  "--shadow-sm": "oklch(0 0 0 / 8%)",
  "--shadow-md": "oklch(0 0 0 / 15%)",
  "--accent-purple": "oklch(0.45 0.12 260)",
  "--accent-purple-hover": "oklch(0.55 0.12 260)",
  "--warning-bg": "oklch(0.88 0.06 55)",
  "--warning-text": "oklch(0.5 0.12 55)",
  "--danger-bg": "oklch(0.92 0.08 15)",
  "--danger-text": "oklch(0.45 0.15 15)",
  "--success-bg": "oklch(0.9 0.06 145)",
  "--success-text": "oklch(0.5 0.12 145)",
  "--focus-ring": "oklch(0.45 0.12 260 / 30%)",
};

export const themeDefinitions: Record<BuiltInThemeName, ThemeDefinition> = {
  light: lightTheme,
  dark: darkTheme,
  darkish: darkishTheme,
  "alternative-light": alternativeLightTheme,
};

// ---------------------------------------------------------------------------
// Contrast text auto-derivation
// ---------------------------------------------------------------------------

function deriveContrastText(def: ThemeDefinition) {
  if (def.colorScheme === "light") {
    return {
      "--contrast-text-light": "oklch(0.985 0 0)",
      "--contrast-text-dark": def["--color-base-content"],
    };
  }
  return {
    "--contrast-text-light": def["--color-base-content"],
    "--contrast-text-dark": def["--color-base-100"],
  };
}

// ---------------------------------------------------------------------------
// Apply theme to the document
// ---------------------------------------------------------------------------

/** All CSS variable keys that applyTheme sets (used for cleanup). */
const allVariableKeys: string[] = [
  ...Object.keys(darkTheme).filter((k) => k !== "colorScheme"),
  "--contrast-text-light",
  "--contrast-text-dark",
];

/**
 * Apply a theme to `<html>` — works for both built-in and custom themes.
 * Also caches the applied variables in localStorage for FOUC prevention.
 */
export function applyTheme(
  name: ThemeName,
  customColors?: CustomThemeColors,
): void {
  const html = document.documentElement;

  let vars: Record<string, string>;
  let colorScheme: "light" | "dark";

  if (name === "custom") {
    const colors = customColors ?? defaultCustomColors;
    colorScheme = isLightOklch(colors["--color-base-100"]) ? "light" : "dark";

    // Start from dark-theme defaults for any keys not in CustomThemeColors
    const fullVars: Record<string, string> = {};
    for (const [k, v] of Object.entries(darkTheme)) {
      if (k !== "colorScheme") fullVars[k] = v;
    }
    // Overlay custom colors
    for (const [k, v] of Object.entries(colors)) {
      fullVars[k] = v;
    }
    // Derive contrast text
    const contrast = deriveContrastText({
      colorScheme,
      ...fullVars,
    } as ThemeDefinition);
    fullVars["--contrast-text-light"] = contrast["--contrast-text-light"];
    fullVars["--contrast-text-dark"] = contrast["--contrast-text-dark"];

    vars = fullVars;
  } else {
    const def = themeDefinitions[name];
    colorScheme = def.colorScheme;
    const contrast = deriveContrastText(def);
    vars = {} as Record<string, string>;
    for (const [k, v] of Object.entries(def)) {
      if (k !== "colorScheme") vars[k] = v;
    }
    vars["--contrast-text-light"] = contrast["--contrast-text-light"];
    vars["--contrast-text-dark"] = contrast["--contrast-text-dark"];
  }

  // Apply to DOM
  html.setAttribute("data-theme", name);
  html.style.setProperty("color-scheme", colorScheme);
  for (const [key, value] of Object.entries(vars)) {
    html.style.setProperty(key, value);
  }

  // Cache for FOUC prevention inline script
  try {
    localStorage.setItem(
      "theme-vars",
      JSON.stringify({ name, colorScheme, vars }),
    );
  } catch {
    // Quota exceeded — non-critical
  }
}

/**
 * Remove all theme inline style properties from `<html>`.
 * Called when switching themes to avoid stale values.
 */
export function clearThemeProperties(): void {
  const html = document.documentElement;
  html.style.removeProperty("color-scheme");
  for (const key of allVariableKeys) {
    html.style.removeProperty(key);
  }
}

// ---------------------------------------------------------------------------
// Theme preview helpers
// ---------------------------------------------------------------------------

export type ThemePreviewColors = {
  bg: string;
  surface: string;
  accent: string;
  text: string;
};

/**
 * Get hex colors for the theme preview miniature.
 * For built-in themes, derives from the theme definition.
 * For custom themes, pass customColors.
 */
export function getThemePreviewColors(
  name: ThemeName,
  customColors?: CustomThemeColors,
): ThemePreviewColors {
  if (name === "custom") {
    const colors = customColors ?? defaultCustomColors;
    return {
      bg: oklchToHex(colors["--color-base-100"]),
      surface: oklchToHex(colors["--color-base-200"]),
      accent: oklchToHex(colors["--accent-purple"]),
      text: oklchToHex(colors["--color-base-content"]),
    };
  }

  const def = themeDefinitions[name];
  return {
    bg: oklchToHex(def["--color-base-100"]),
    surface: oklchToHex(def["--color-base-200"]),
    accent: oklchToHex(def["--accent-purple"]),
    text: oklchToHex(def["--color-base-content"]),
  };
}

// ---------------------------------------------------------------------------
// System preference detection
// ---------------------------------------------------------------------------

/** Returns the theme name matching the OS color-scheme preference. */
export function getSystemPreferredTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

// ---------------------------------------------------------------------------
// Extract CustomThemeColors from a built-in theme
// ---------------------------------------------------------------------------

/**
 * Extract the {@link CustomThemeColors} subset from a built-in theme definition.
 * Useful for importing a built-in theme's colors into the custom theme editor.
 */
export function extractCustomColorsFromTheme(name: BuiltInThemeName): CustomThemeColors {
  const def = themeDefinitions[name];
  return {
    "--color-base-100": def["--color-base-100"],
    "--color-base-200": def["--color-base-200"],
    "--color-base-300": def["--color-base-300"],
    "--color-base-content": def["--color-base-content"],
    "--color-primary": def["--color-primary"],
    "--color-primary-content": def["--color-primary-content"],
    "--color-secondary": def["--color-secondary"],
    "--color-secondary-content": def["--color-secondary-content"],
    "--color-accent": def["--color-accent"],
    "--color-accent-content": def["--color-accent-content"],
    "--color-neutral": def["--color-neutral"],
    "--color-neutral-content": def["--color-neutral-content"],
    "--color-info": def["--color-info"],
    "--color-success": def["--color-success"],
    "--color-warning": def["--color-warning"],
    "--color-error": def["--color-error"],
    "--surface-overlay": def["--surface-overlay"],
    "--surface-overlay-hover": def["--surface-overlay-hover"],
    "--text-subtle": def["--text-subtle"],
    "--text-muted": def["--text-muted"],
    "--text-placeholder": def["--text-placeholder"],
    "--border-subtle": def["--border-subtle"],
    "--border-default": def["--border-default"],
    "--border-strong": def["--border-strong"],
    "--border-active": def["--border-active"],
    "--shadow-sm": def["--shadow-sm"],
    "--shadow-md": def["--shadow-md"],
    "--accent-purple": def["--accent-purple"],
    "--accent-purple-hover": def["--accent-purple-hover"],
    "--warning-bg": def["--warning-bg"],
    "--warning-text": def["--warning-text"],
    "--success-text": def["--success-text"],
    "--focus-ring": def["--focus-ring"],
  };
}
