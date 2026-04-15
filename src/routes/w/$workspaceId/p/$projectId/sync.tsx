import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SyncView } from "@/components/sync/sync-view";

const syncSearchSchema = z.object({
  tab: z.enum(["sync", "import", "export"]).optional(),
});

export const Route = createFileRoute("/w/$workspaceId/p/$projectId/sync")({
  component: SyncInProjectRoute,
  validateSearch: syncSearchSchema,
});

function SyncInProjectRoute() {
  const { tab } = Route.useSearch();

  return <SyncView initialTab={tab} />;
}
