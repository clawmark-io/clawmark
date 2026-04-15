# Sync

## Overview

Sync is optional and self-hosted. Data is CRDT-based (Automerge), so conflicts resolve automatically. The sync layer has three concerns:

1. **Document sync** — Automerge protocol over WebSocket
2. **Image sync** — Separate HTTP PUT/GET for logos and backgrounds
3. **Server** — Node.js process that stores and relays data

---

## Client Side

Code in `src/lib/sync/`.

### SyncManager (`sync-manager.ts`)

- Manages WebSocket connections to configured sync servers
- Maintains a connection pool keyed by server ID
- After CRDT sync settles, schedules image sync (3-second delay)
- Handles disconnect/reconnect cleanup

### ImageSync (`image-sync.ts`)

- `uploadImageToServer()` / `downloadImageFromServer()` — individual transfers
- `fetchServerInventory()` — list images the server has
- Reconciliation: compares local OPFS images against server inventory, uploads missing, downloads missing

### ImageQueue (`image-queue.ts`)

- IndexedDB-backed queue for pending image uploads
- Persists operations while offline
- Flushed automatically on sync reconnection

### Connection Flow

1. User adds server config in Sync view
2. `SyncManager.connect(config)` opens WebSocket
3. Automerge protocol exchanges document changes
4. After settling, image reconciliation runs
5. Missing images uploaded/downloaded

---

Server-side is described in [/docs/sync-server-side.md]

## Configuration

Stored client-side in `useSyncStore` (persisted per workspace in LocalStorage).

```typescript
SyncServerConfig {
  id, name, host, port
  useTls: boolean
  accessToken: string
  syncMode: "automatic" | "manual"
}
```

- Multiple servers supported per workspace
- **Automatic** — connects on app start
- **Manual** — user triggers sync explicitly

---

## UI

All sync UI is in `src/components/sync/`:

- `SyncTabContent` — server list, connection status, add/remove servers
- `SyncServerForm` — server config fields
- `AddServerDialog` — new server setup
