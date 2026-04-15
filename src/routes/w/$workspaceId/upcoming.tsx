import { createFileRoute } from "@tanstack/react-router";
import { UpcomingView } from "@/components/upcoming/upcoming-view";
import { ContentArea } from "@/components/content-area";

export const Route = createFileRoute("/w/$workspaceId/upcoming")({
  component: UpcomingRoute,
});

function UpcomingRoute() {
  return (
    <ContentArea>
      <UpcomingView />
    </ContentArea>
  );
}
