import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsView } from "@/components/settings/settings-view";
import { ContentArea } from "@/components/content-area";

const settingsSearchSchema = z.object({
  tab: z.enum(["general", "look-and-feel", "cloud-sync"]).optional(),
});

export const Route = createFileRoute("/w/$workspaceId/settings")({
  component: SettingsRoute,
  validateSearch: settingsSearchSchema,
});

function SettingsRoute() {
  const { tab } = Route.useSearch();

  return (
    <ContentArea>
      <SettingsView initialTab={tab} />
    </ContentArea>
  );
}
