# Server Side

Separate Node.js project in [/sync-server/]. Uses Hono framework.

## Endpoints

```
GET  /health                              # Health check
GET  /v1/workspaces?token=<t>            # List synced workspaces
GET  /v1/sync/:wsId/data?token=<t>       # WebSocket upgrade (Automerge protocol)
PUT  /v1/sync/:wsId/images/:uuid?token=<t>  # Upload image
GET  /v1/sync/:wsId/images/:uuid?token=<t>  # Download image
GET  /v1/sync/:wsId/images?token=<t>     # List images in workspace
```

## Key Components

| File | Purpose |
|------|---------|
| `server.ts` | Hono app, route definitions, WebSocket upgrade |
| `workspace-repo.ts` | Per-workspace Automerge repo manager, image storage |
| `auth.ts` | Token-based authentication middleware |
| `config.ts` | Configuration from YAML or environment variables |
| `workspace-index/` | Tracks known workspaces, maintains timestamped backups |

## Storage Layout

```
storagePath/
├── workspaces/{workspaceId}/   # Automerge documents + images
├── backups/                     # workspace-index snapshots
└── workspace-index.json         # Current workspace registry
```

## Server Startup

1. Load config (YAML / env)
2. Initialize workspace index + repo manager
3. Start Hono server
4. Run image garbage collection (orphaned images)
5. Schedule periodic GC

---
