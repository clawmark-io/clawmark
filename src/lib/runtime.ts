import { isTauri } from "@tauri-apps/api/core";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export function isPWA(): boolean {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  return (
    navigatorWithStandalone.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );
}

export function isWeb(): boolean {
  return !isTauri() && !isPWA();
}
