export type ThemeName =
  | "light"
  | "dark"
  | "darkish"
  | "alternative-light"
  | "custom";

export type CustomThemeColors = {
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
  "--color-success": string;
  "--color-warning": string;
  "--color-error": string;
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
  "--success-text": string;
  "--focus-ring": string;
};

export const defaultCustomColors: CustomThemeColors = {
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
  "--color-success": "oklch(0.5 0.1 145)",
  "--color-warning": "oklch(0.85 0.12 55)",
  "--color-error": "oklch(0.704 0.191 22.216)",
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
  "--success-text": "oklch(0.5 0.1 145)",
  "--focus-ring": "oklch(0.6 0.18 255 / 20%)",
};
