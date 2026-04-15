import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsView } from "@/components/settings/settings-view";

const settingsSearchSchema = z.object({
  tab: z.enum(["general", "look-and-feel", "cloud-sync"]).optional(),
});

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/workspace-settings")({
  component: WorkspaceSettingsInProjectRoute,
  validateSearch: settingsSearchSchema,
});

function WorkspaceSettingsInProjectRoute() {
  const { tab } = Route.useSearch();

  return <SettingsView initialTab={tab} />;
}
