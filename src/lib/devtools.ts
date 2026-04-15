import { isTauri } from "@tauri-apps/api/core";
import type { ThemeName } from "@/types/theme";
import type { WorkspaceDefaultView } from "@/types/data-model";
import { useThemeStore } from "@/stores/theme-store";
import type { WorkspacesManager } from "@/lib/workspace/workspace-manager";
import { createTestWorkspace } from "@/lib/devtools/test-workspace";
import { updateDefaultView } from "@/lib/workspace/actions/theme/update-default-view";

const VALID_THEMES: ThemeName[] = [
  "light",
  "dark",
  "darkish",
  "alternative-light",
  "custom",
];

let manager: WorkspacesManager | null = null;

export function setDevtoolsManager(m: WorkspacesManager): void {
  manager = m;
}

function getManager(): WorkspacesManager {
  if (!manager) {
    throw new Error("[devtools] Manager not initialized. Wait for the app to load.");
  }
  return manager;
}

async function resizeForScreenshot(): Promise<void> {
  if (!isTauri()) {
    console.warn("[devtools] resizeForScreenshot is only available in Tauri");
    return;
  }

  const { getCurrentWebviewWindow } = await import(
    "@tauri-apps/api/webviewWindow"
  );
  const { LogicalSize } = await import("@tauri-apps/api/dpi");
  const win = getCurrentWebviewWindow();
  await win.setSize(new LogicalSize(2560, 1440));
  console.log("[devtools] Window resized to 2560x1440");
}

function setTheme(themeName: ThemeName): void {
  if (!VALID_THEMES.includes(themeName)) {
    console.warn(
      `[devtools] Invalid theme "${themeName}". Valid themes: ${VALID_THEMES.join(", ")}`,
    );
    return;
  }

  useThemeStore.getState().setTheme(themeName);
  console.log(`[devtools] Theme set to "${themeName}"`);
}

function setZoom(level: number): void {
  document.body.style.zoom = String(level);
  console.log(`[devtools] Zoom set to ${level * 100}%`);
}

async function setWorkspaceDefaultView(
  workspaceId: string,
  defaultView: WorkspaceDefaultView,
): Promise<void> {
  const m = getManager();
  const client = await m.getWorkspace(workspaceId, { loadServices: true });
  updateDefaultView(client.getHandle(), defaultView);
  m.releaseWorkspace(client);
  console.log(`[devtools] Default view for "${workspaceId}" set to "${defaultView}"`);
}

export const debug = {
  resizeForScreenshot,
  setTheme,
  setZoom,
  createTestWorkspace: () => createTestWorkspace(getManager()),
  setWorkspaceDefaultView,
};
