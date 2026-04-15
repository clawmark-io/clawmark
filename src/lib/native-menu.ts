import { isTauri } from "@tauri-apps/api/core";
import i18n from "@/i18n";
import { branding } from "@/lib/branding";
import type { WorkspacesManager } from "@/lib/workspace/workspace-manager.ts";
import { useMenuActionsStore } from "@/stores/menu-actions";
import { useCommandPaletteState } from "@/stores/command-palette";

let _manager: WorkspacesManager | null = null;

function handleWorkspaces() {
  _manager?.setActiveWorkspaceId(null);
}

function handleNewWorkspace() {
  _manager?.setActiveWorkspaceId(null);
  useMenuActionsStore.getState().requestNewWorkspace();
}

function handleCommandPalette() {
  useCommandPaletteState.getState().show();
}

function handleReload() {
  window.location.reload();
}

function handleZoomIn() {
  const z = parseFloat(document.body.style.zoom || "1");
  document.body.style.zoom = String(Math.min(z + 0.1, 3));
}

function handleZoomOut() {
  const z = parseFloat(document.body.style.zoom || "1");
  document.body.style.zoom = String(Math.max(0.3, z - 0.1));
}

function handleZoomReset() {
  document.body.style.zoom = "1";
}

async function handleFullscreen() {
  const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
  const win = getCurrentWebviewWindow();
  const isFullscreen = await win.isFullscreen();
  await win.setFullscreen(!isFullscreen);
}

async function handleNewWindow() {
  const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
  const label = `window-${Date.now()}`;
  void new WebviewWindow(label, {
    title: branding.appName,
    width: 800,
    height: 600,
  });
}

function handleDelete() {
  document.execCommand("delete");
}

async function handleOpenGitHub() {
  const { openUrl } = await import("@tauri-apps/plugin-opener");
  await openUrl(branding.github);
}

async function handleOpenWebsite() {
  const { openUrl } = await import("@tauri-apps/plugin-opener");
  await openUrl(branding.website);
}

export async function buildAppMenu(manager: WorkspacesManager): Promise<void> {
  _manager = manager;
  if (!isTauri()) return;

  const { Menu, Submenu, PredefinedMenuItem, MenuItem } = await import("@tauri-apps/api/menu");

  const tm = i18n.getFixedT(null, "menu");
  const tc = i18n.getFixedT(null, "common");

  const fileMenu = await Submenu.new({
    text: tm("file"),
    items: [
      await MenuItem.new({ id: "workspaces", text: tc("workspaces"), action: handleWorkspaces }),
      await MenuItem.new({ id: "new-workspace", text: tm("newWorkspace"), action: handleNewWorkspace }),
      await PredefinedMenuItem.new({ item: "Separator" }),
      await PredefinedMenuItem.new({ item: "Quit", text: tm("exit") }),
    ],
  });

  const editMenu = await Submenu.new({
    text: tm("edit"),
    items: [
      await PredefinedMenuItem.new({ item: "Cut", text: tm("cut") }),
      await PredefinedMenuItem.new({ item: "Copy", text: tm("copy") }),
      await PredefinedMenuItem.new({ item: "Paste", text: tm("paste") }),
      await MenuItem.new({ id: "delete", text: tc("deleteButton"), action: handleDelete }),
    ],
  });

  const viewMenu = await Submenu.new({
    text: tm("view"),
    items: [
      await MenuItem.new({ id: "reload", text: tm("reload"), accelerator: "CmdOrCtrl+R", action: handleReload }),
      await PredefinedMenuItem.new({ item: "Separator" }),
      await MenuItem.new({ id: "zoom-in", text: tm("zoomIn"), accelerator: "CmdOrCtrl+=", action: handleZoomIn }),
      await MenuItem.new({ id: "zoom-reset", text: tm("resetZoom"), accelerator: "CmdOrCtrl+0", action: handleZoomReset }),
      await MenuItem.new({ id: "zoom-out", text: tm("zoomOut"), accelerator: "CmdOrCtrl+-", action: handleZoomOut }),
      await PredefinedMenuItem.new({ item: "Separator" }),
      await MenuItem.new({ id: "fullscreen", text: tm("toggleFullScreen"), accelerator: "F11", action: handleFullscreen }),
    ],
  });

  const windowMenu = await Submenu.new({
    text: tm("window"),
    items: [
      await MenuItem.new({ id: "command-palette", text: tm("commandPalette"), accelerator: "CmdOrCtrl+K", action: handleCommandPalette }),
      await MenuItem.new({ id: "new-window", text: tm("openNewWindow"), action: handleNewWindow }),
      await PredefinedMenuItem.new({ item: "Separator" }),
      await PredefinedMenuItem.new({ item: "Minimize", text: tm("minimize") }),
      await PredefinedMenuItem.new({ item: "Maximize", text: tm("maximize") }),
    ],
  });

  const aboutDescription = `${tm("aboutDescription")}\n\n${tc("websitesLabel")}:\n    ${branding.website}\n    ${branding.github}`;

  const helpMenu = await Submenu.new({
    text: tc("help"),
    items: [
      await MenuItem.new({ id: "github", text: tm("goToGitHub"), action: handleOpenGitHub }),
      await MenuItem.new({ id: "website", text: tm("goToWebsite"), action: handleOpenWebsite }),
      await PredefinedMenuItem.new({ item: "Separator" }),
      await PredefinedMenuItem.new({
        item: {
          About: {
            name: branding.appName,
            version: branding.version,
            comments: aboutDescription,
          },
        },
        text: tm("about"),
      }),
    ],
  });

  const menu = await Menu.new({
    items: [fileMenu, editMenu, viewMenu, windowMenu, helpMenu],
  });

  await menu.setAsAppMenu();
}
