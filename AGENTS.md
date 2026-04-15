# Clawmark

Tauri 2 + React 19 + TypeScript desktop task management app. Frontend is a Vite SPA; Tauri is used as a wrapper.

## Commands

```bash
npm run build              # TypeScript check + Vite production build
npm run tauri dev          # Full dev environment (Vite + Tauri window)
npm run tauri build        # Full desktop app build
```

## Key Constraints

- This is a frontend-only app. Use browser native APIs, not Tauri backend commands, unless explicitly asked.
- TypeScript strict mode is enabled with no unused locals/parameters.
- Never use barrel files!

## Architecture

- `src/` — React frontend
- `src-tauri/` — Rust backend (only used as wrapper for now)
- `sync-server/` — Node.js sync server (separate from the desktop app)
- Frontend invokes Rust via `invoke()` from `@tauri-apps/api/core` (only if backend commands are needed)
- [Tauri usage rules](docs/Tauri.md) — guard all `@tauri-apps/` code with `isTauri()`

## Data model changes

Any changes to data model (e.g. changing fields in tasks, projects, workspaces) must be backwards compatible and should not require a migration.
When doing such changes, always make sure they are compatible with the sync process, sync server, importing and exporting features.

## Documentation

- [Main Views](docs/main-views.md) — views, navigation model, feature details
- Architecture
  - [Routing](docs/Routing.md) — TanStack Router setup, route structure, navigation patterns
  - [Sync (client)](docs/sync.md) — CRDT sync, image sync, connection flow
  - [Sync (server)](docs/sync-server-side.md) — endpoints, storage, server startup
  - [Code Structure — Frontend](docs/code-structure-frontend.md) — components, stores, lib, hooks
  - [Code Structure — Sync Server](docs/code-structure-sync-server.md) — server directory layout
  - [Import & Export](docs/import-export.md) — JSON, Kanri, CSV formats
- [Command Palette](docs/command-palette.md) — modes, commands, rules
- [Keymap](docs/keymap.md) — keyboard shortcuts and command palette
- [i18n](docs/i18n.md) — internationalization, translation files, adding new strings
- [Debug](docs/Debug.md) — `window.debug` for debugging and testing

## Runtime

Use playwright if needed.

## Core Principles

### User Values

- Privacy first - no data collection, no tracking, no analytics. Data belongs to the user, not the app. User decides if and how to share/sync data.
- No vendor lock-in - users can export their data at any time and move to another app if they choose.

### Code Values

- Simplicity - simple, clear code is preferred over complex abstractions. Code should be easy to read, understand and maintain.
- Modularity - code should be organized into small, focused modules and components with clear responsibilities.
- Consistency - follow consistent patterns and conventions across the codebase for structure, naming, and style.