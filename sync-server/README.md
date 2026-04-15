# Clawmark Sync Server

A self-hosted sync server for the Clawmark desktop app. Uses Automerge's native CRDT sync protocol over WebSocket.

## Running Locally

### Prerequisites

- Node.js 22+

### Setup

Install dependencies:

```bash
npm install
```

Copy the example config and set a secure access token:

```bash
cp config.example.yaml config.yaml
```

Edit `config.yaml` — at minimum, change `accessToken` to a secure random string.

### Development

```bash
npm run dev
```

Starts the server with hot reload via `tsx watch`.

### Production

```bash
npm run build
npm start
```

Builds TypeScript to `dist/` and runs with plain Node.js.

## Running with Docker

### Build the image

```bash
docker build -t clawmark-sync-server .
```

### Run the container

```bash
docker run -d \
  --name clawmark-sync \
  -p 3030:3030 \
  -e ACCESS_TOKEN=your-secure-random-string \
  -v clawmark-data:/data \
  clawmark-sync-server
```

### Docker Compose

```yaml
services:
  sync-server:
    build: .
    ports:
      - "3030:3030"
    environment:
      - ACCESS_TOKEN=your-secure-random-string
    volumes:
      - sync-data:/data
    restart: unless-stopped

volumes:
  sync-data:
```

## Configuration

Configuration is loaded in layers: **defaults → config.yaml → environment variables**. Environment variables always take precedence.

When running with Docker, environment variables are the recommended way to configure the server. A `config.yaml` file is not needed.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ACCESS_TOKEN` | — | **Required.** Shared secret for client authentication. |
| `PORT` | `3030` | Listen port. |
| `HOST` | `0.0.0.0` | Bind address. |
| `STORAGE_PATH` | `./data` (local) or `/data` (Docker) | Directory for workspace data and backups. |
| `CONFIG_PATH` | `./config.yaml` | Path to YAML config file. |
| `WORKSPACE_INDEX_MAX_BACKUPS` | `100` | Max workspace-index backup files to retain. |
| `IMAGE_GC_INTERVAL_HOURS` | `24` | Interval between image garbage collection runs. |

### config.yaml

Used for local development. See `config.example.yaml` for the full template:

```yaml
host: "0.0.0.0"
port: 3030
storagePath: "./data"
accessToken: "change-me-to-a-secure-random-string"
workspaceIndex:
  maxBackups: 100
imageGc:
  intervalHours: 24
```

## Data Storage

All persistent data lives under the configured storage path (`STORAGE_PATH` / `storagePath`):

```
data/
├── workspace-index.json         # Registry of synced workspaces
├── backups/                     # Timestamped workspace-index snapshots
└── workspaces/
    └── <workspaceId>/
        ├── workspace/           # Automerge CRDT documents
        └── images/              # Synced project images
```

When running with Docker, mount a volume at `/data` to persist this across container restarts.

## Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check — returns `{ "status": "ok" }` |
| `GET` | `/v1/workspaces` | Yes | List all synced workspaces |
| `GET` | `/v1/sync/:wsId/data` | Yes | WebSocket upgrade for Automerge sync |
| `PUT` | `/v1/sync/:wsId/images/:uuid` | Yes | Upload an image |
| `GET` | `/v1/sync/:wsId/images/:uuid` | Yes | Download an image |
| `GET` | `/v1/sync/:wsId/images` | Yes | List images in a workspace |

Authentication is via query parameter: `?token=<ACCESS_TOKEN>`.
