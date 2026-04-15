# Code Structure — Frontend

## Entry Points

- `main.tsx` — Creates `WorkspacesManager`, initializes the router, mounts `<RouterProvider>`
- `router.ts` — Router instance with hash history and typed context
- `routes/__root.tsx` — Root layout: global providers, hooks, command palette
- `routes/w/$workspaceId/route.tsx` — Workspace layout: sidebar, keyboard shortcuts, dialogs

See [Routing](Routing.md) for the full route structure and patterns.

## Components (`src/components/`)

Organized by feature. Each folder is a view or UI concern:

| Folder             | Contents                                                     |
|--------------------|--------------------------------------------------------------|
| `home/`            | Project grid, project wizard (create/import/clone/template)  |
| `kanban/`          | Board, columns, cards, toolbar                               |
| `tasks/`           | Task list, rows, add input, toolbar                          |
| `task-detail/`     | Task editor dialog, field components                         |
| `upcoming/`        | Cross-project upcoming view                                  |
| `project/`         | Project header, settings, tags/columns editors               |
| `settings/`        | Global settings, theme selector, custom theme editor         |
| `sync/`            | Sync servers, import tab, export tab                         |
| `workspaces/`      | Workspace picker, create/delete/rename dialogs               |
| `command-palette/` | Fuzzy-search command palette                                 |
| `sidebar/`         | Navigation sidebar                                           |
| `help/`            | Help dialog                                                  |
| `ui/`              | Reusable primitives (dialog, input, checkbox, tooltip, etc.) |

## Routes (`src/routes/`)

TanStack Router file-based routes. Layout routes (`route.tsx`) render shared UI and `<Outlet />`. See [Routing](Routing.md) for details.

## State Management (`src/stores/`)

**Zustand** for app state. Navigation is handled by the router, not Zustand.

**Persisted (LocalStorage):**

- `workspace-list-store.ts` — workspace list, active workspace
- `sync-store.ts` — sync server configs per workspace
- `theme-store.ts` — current theme
- `settings-store.ts` — app-wide preferences

**Runtime only:**

- `command-palette.ts`, `sidebar.ts` — UI state for modals/panels
- `create-project.ts` — create project dialog state

**React Context:**

- `workspace-context.tsx` — active workspace data + all CRUD operations (addTask, deleteProject, etc.). Wraps Automerge
  repo lifecycle.
- `manager-context.tsx` — provides the `WorkspacesManager` singleton from router context

## Business Logic (`src/lib/`)

| Path                   | Purpose                                                       |
|------------------------|---------------------------------------------------------------|
| `workspace/`           | Workspace manager, workspace handle, actions                  |
| `automerge/`           | Repo creation, IndexedDB persistence, splice helpers          |
| `data-model.ts`        | Factory functions for creating workspace/project/task objects |
| `commands/`            | Command palette registry + command definitions                |
| `exports/`             | JSON, Kanri, CSV exporters                                    |
| `imports/`             | JSON, Kanri importers + Zod schemas                           |
| `sync/`                | SyncManager (WebSocket), ImageSync, ImageQueue                |
| `search/`              | Fuzzy matching, task search                                   |
| `opfs.ts`              | Origin Private File System for image storage                  |
| `project-clone.ts`     | Clone project with options                                    |
| `project-templates.ts` | Built-in project templates                                    |
| `auto-archive.ts`      | Background auto-archive for completed tasks                   |
| `upcoming-utils.ts`    | Collect and group tasks by date bucket                        |

## Types (`src/types/`)

- `data-model.ts` — Workspace, Project, Task, Column, Tag, Subtask
- `sync.ts` — SyncServerConfig, SyncConnectionStatus
- `theme.ts` — Theme types

## Hooks (`src/hooks/`)

Custom hooks for keyboard shortcuts, workspace access, imports, theme effects, grid navigation, and background
processes.

## Storage

| What                        | Where                                       |
|-----------------------------|---------------------------------------------|
| Workspace documents         | IndexedDB (`tasks-ws-{workspaceId}`)        |
| Workspace doc URL           | LocalStorage (`tasks-ws-{workspaceId}-url`) |
| Zustand persisted stores    | LocalStorage                                |
| Images (logos, backgrounds) | OPFS (`/workspace-{id}/`)                   |
