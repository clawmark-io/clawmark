import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { WorkspacesScreen } from "@/components/workspaces/workspaces-screen";
import { useManager } from "@/stores/manager-context";
import { useStore } from "@/hooks/use-store";
import { useThemeStore } from "@/stores/theme-store";

export const Route = createFileRoute("/w/")({
  component: WorkspacePickerRoute,
});

function WorkspacePickerRoute() {
  usePickerTheme();
  return <WorkspacesScreen />;
}

function usePickerTheme() {
  const manager = useManager();
  const lastUsedTheme = useStore(manager.lastUsedTheme);
  const applyThemeSettings = useThemeStore((s) => s.applyThemeSettings);

  useEffect(() => {
    applyThemeSettings(lastUsedTheme);
  }, [lastUsedTheme, applyThemeSettings]);
}
