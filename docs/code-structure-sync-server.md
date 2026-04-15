# Code Structure — Sync Server

Separate Node.js project in `sync-server/`. See [sync-server-side.md](./sync-server-side.md) for endpoints and runtime
details.

## Directory Layout

```
sync-server/src/
├── index.ts              # Entry point
├── server.ts             # Hono app + endpoints
├── workspace-repo.ts     # Per-workspace Automerge repo manager
├── auth.ts               # Token middleware
├── config.ts             # YAML/env config loader
├── logging.ts            # Structured logging
└── workspace-index/      # Tracks synced workspaces + backups
```

## Key Components

| File                | Purpose                                                |
|---------------------|--------------------------------------------------------|
| `server.ts`         | Hono app, route definitions, WebSocket upgrade         |
| `workspace-repo.ts` | Per-workspace Automerge repo manager, image storage    |
| `auth.ts`           | Token-based authentication middleware                  |
| `config.ts`         | Configuration from YAML or environment variables       |
| `workspace-index/`  | Tracks known workspaces, maintains timestamped backups |

## Storage Layout

```
storagePath/
├── workspaces/{workspaceId}/   # Automerge documents + images
├── backups/                     # workspace-index snapshots
└── workspace-index.json         # Current workspace registry
```
