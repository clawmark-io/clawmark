import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ManagerProvider } from "@/stores/manager-context";
import { useThemeEffect } from "@/hooks/use-theme-effect";
import { useNativeMenu } from "@/hooks/use-native-menu";
import { useTokenRefreshMonitor } from "@/hooks/use-token-refresh";
import { CommandPaletteDialog } from "@/components/command-palette/command-palette-dialog";
import { useCommandPaletteState } from "@/stores/command-palette";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import type { RouterContext } from "@/router";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const { manager } = Route.useRouteContext();

  useThemeEffect();
  useTokenRefreshMonitor();

  return (
    <ManagerProvider manager={manager}>
      <TooltipProvider>
        <RootContent />
      </TooltipProvider>
    </ManagerProvider>
  );
}

function RootContent() {
  const { show } = useCommandPaletteState();

  useNativeMenu();
  useKeyboardShortcut("k", () => show(), { meta: true });
  useKeyboardShortcut("k", () => show(), { ctrl: true });

  return (
    <>
      <Outlet />
      <CommandPaletteDialog />
    </>
  );
}
