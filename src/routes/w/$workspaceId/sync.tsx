import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SyncView } from "@/components/sync/sync-view";
import { ContentArea } from "@/components/content-area";

const syncSearchSchema = z.object({
  tab: z.enum(["sync", "import", "export"]).optional(),
});

export const Route = createFileRoute("/w/$workspaceId/sync")({
  component: SyncRoute,
  validateSearch: syncSearchSchema,
});

function SyncRoute() {
  const { tab } = Route.useSearch();

  return (
    <ContentArea>
      <SyncView initialTab={tab} />
    </ContentArea>
  );
}
