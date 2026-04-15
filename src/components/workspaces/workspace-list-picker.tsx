type ServerWorkspaceEntry = {
  workspaceId: string;
  name: string;
  lastSyncedAt: string;
};

type WorkspaceListPickerProps = {
  workspaces: ServerWorkspaceEntry[];
  localWorkspaceIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function formatSyncTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function WorkspaceListPicker({ workspaces, localWorkspaceIds, selectedId, onSelect }: WorkspaceListPickerProps) {
  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">No workspaces found on this server.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
      {workspaces.map((ws) => {
        const isLocal = localWorkspaceIds.includes(ws.workspaceId);
        const isSelected = selectedId === ws.workspaceId;

        return (
          <button
            key={ws.workspaceId}
            onClick={() => { if (!isLocal) onSelect(ws.workspaceId); }}
            disabled={isLocal}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
              isSelected
                ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]/10"
                : "border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--surface-overlay)]"
            } ${isLocal ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{ws.name}</span>
                {isLocal ? (
                  <span className="text-xs text-[var(--text-muted)] shrink-0">Already exists locally</span>
                ) : null}
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Last synced {formatSyncTime(ws.lastSyncedAt)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
