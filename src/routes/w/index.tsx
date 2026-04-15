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
  const setTheme = useThemeStore((s) => s.setTheme);
  const setCustomColors = useThemeStore((s) => s.setCustomColors);

  useEffect(() => {
    setTheme(lastUsedTheme.theme);
    if (lastUsedTheme.customColors) {
      setCustomColors(lastUsedTheme.customColors);
    }
  }, [lastUsedTheme, setTheme, setCustomColors]);
}
