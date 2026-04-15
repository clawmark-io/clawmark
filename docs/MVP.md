# Technical Project Description

## 1. Overview

Tasks App is a local-first project management application inspired by tools like Trello, Asana, and Kanban-style task
boards. It prioritizes offline-first data ownership, where all user data lives on the device by default, with an
optional cloud sync layer planned for a future phase. The app targets desktop and mobile platforms via a single
codebase.

---

## 2. Core Philosophy

- **Local-first**: All data is stored and processed locally. The app must be fully functional without any network
  connection.
- **CRDT-powered**: Data is modeled using Automerge CRDTs, enabling conflict-free merging when cloud sync is introduced
  later.
- **Cross-platform**: A single codebase ships to macOS, Windows, Linux, iOS, and Android via Tauri.
- **Keyboard-centric**: Power users can navigate and operate the entire app without a mouse.

---

## 3. Technical Stack

| Layer                  | Technology                     | Purpose                                                     |
|------------------------|--------------------------------|-------------------------------------------------------------|
| UI Framework           | React                          | Component-based UI                                          |
| Component Library      | shadcn/ui (Radix + Tailwind)   | Accessible, themeable primitives                            |
| Desktop & Mobile Shell | Tauri v2                       | Native wrapper for desktop/mobile; no Rust application code |
| Local Data Layer       | @automerge/automerge (NPM)     | CRDT document store, runs entirely in JS/WASM               |
| Persistence (Web)      | IndexedDB (via automerge-repo) | Browser-native storage                                      |
| Persistence (Desktop)  | Tauri fs plugin + IndexedDB    | File system or IndexedDB depending on strategy              |
| Build / Bundler        | Vite                           | Fast dev server & production builds                         |

### Key Technical Decisions

- **No custom Rust code.** Tauri serves purely as a native shell (window chrome, app packaging, platform distribution).
  All application logic, including Automerge operations, lives in the TypeScript/React layer. This means the app runs
  natively in the browser with zero Tauri dependency.
- **Automerge from NPM.** The `@automerge/automerge` and `@automerge/automerge-repo` packages handle document creation,
  manipulation, and persistence entirely on the JS side. `automerge-repo` provides pluggable storage backends (IndexedDB
  for web, filesystem adapter for Tauri if needed).
- **Web-first, Tauri-wrapped.** The app is a standard web application that works in any modern browser. Tauri wraps the
  same build for desktop/mobile distribution, adding native window management and optional filesystem access.
- **No remote server or authentication** is in scope for V1. The Automerge document format is chosen specifically so
  that sync can be layered on later (via `automerge-repo` sync protocol) without data migration.
- **DaisyUI** provides styled, accessible component primitives.

---

## 4. Data Model

The data model stored in Automerge is in /src/types/data-model.ts

### Notes on Automerge Modeling

- **Ordered collections** (columns, subtasks) use Automerge's `List` type to preserve insertion order and support
  concurrent reordering.
- **Maps** (`tasks`, `projects`) are keyed by UUID for O(1) lookup.
- **Images**: On web, stored in OPFS.
- **Timestamps** are stored as ISO 8601 strings or Unix milliseconds.
- **Persistence** is handled by `automerge-repo` with an IndexedDB storage adapter (works in both browser and Tauri's
  webview). No Rust-side persistence code is needed.

---

## 5. Architecture

```
┌─────────────────────────────────────────────────┐
│                   React UI                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐ │
│  │  Views    │ │ Command   │ │  Keyboard     │ │
│  │ (Kanban,  │ │ Palette   │ │  Navigation   │ │
│  │  Tasks,   │ │           │ │  Manager      │ │
│  │  All)     │ │           │ │               │ │
│  └─────┬─────┘ └─────┬─────┘ └───────┬───────┘ │
│        │              │               │         │
│  ┌─────▼──────────────▼───────────────▼───────┐ │
│  │       State Manager (React Context /       │ │
│  │       Zustand + Automerge bindings)        │ │
│  └─────────────────┬──────────────────────────┘ │
│                    │                            │
│  ┌─────────────────▼──────────────────────────┐ │
│  │         @automerge/automerge-repo          │ │
│  │  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │  Document   │  │  Storage Adapter     │ │ │
│  │  │  Handles    │  │  (IndexedDB)         │ │ │
│  │  └─────────────┘  └─────────────────────┘ │ │
│  │  ┌─────────────────────────────────────┐  │ │
│  │  │  Future: Sync Adapter (WebSocket)   │  │ │
│  │  └─────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
        │ (same app, no Rust code)
        │
┌───────▼─────────────────────────────────────────┐
│  Deployment Targets                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Browser  │  │  Tauri   │  │  Tauri       │  │
│  │  (PWA)    │  │  Desktop │  │  Mobile      │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```

### Data Flow

1. **Read**: React UI accesses document state via `automerge-repo` document handles. Changes are observed reactively
   through handle subscriptions.
2. **Write**: UI dispatches a change function → `automerge-repo` applies the change to the Automerge document → persists
   to IndexedDB automatically → subscribed React components re-render.
3. **Reactivity**: `automerge-repo` document handles emit change events, enabling reactive UI updates. A thin React hook
   layer (`useDocument`, `useHandle`) bridges Automerge reactivity to React's rendering cycle.
4. **Platform parity**: The identical JS bundle runs in the browser and inside Tauri's webview. Tauri adds native window
   chrome and app distribution but no custom backend logic.

---

## 6. Feature Breakdown

### 6.1 Workspace & Projects

- Single workspace per app instance (multi-workspace is out of scope).
- Users can create, rename, reorder, and delete projects.
- Projects are not typed. Instead, each project has a `kanbanEnabled` boolean flag (can be toggled at any time).
- When `kanbanEnabled` is true, the Kanban view tab becomes available and columns can be managed.
- When `kanbanEnabled` is false, the Kanban view tab is hidden. Existing columns and task-column assignments are
  preserved in the data model (not deleted), so re-enabling kanban restores the previous board state.
- Project settings: title, description, logo, background image + blur, color palette, tags.

### 6.2 Project Views

Each project exposes a set of views accessible via tabs or a sidebar within the project. The available views depend on
project type and feature readiness:

- **Kanban view**: Column-based board (see §6.3). Only visible when `kanbanEnabled` is true.
- **Tasks view**: Flat, filterable list of all tasks in the project (see §6.4). Always available. When kanban is
  disabled, this is the only active view and serves as the primary interface.
- **Whiteboards**: Freeform canvas (out of scope for V1, placeholder in navigation).
- **Notes**: Obsidian-style markdown notes linked to the project (out of scope for V1, placeholder in navigation).

### 6.3 Kanban View

- **Kanban view**: Only visible when `kanbanEnabled` is true for the project.
- Columns are user-defined, reorderable via drag-and-drop.
- Tasks are draggable between columns and reorderable within a column.
- Column settings: title, color, auto-complete toggle, auto-archive toggle + duration.
- **Filtering**: text search (title + description), tag filter (multi-select), completed status filter.
- **Sleep date**: tasks with `sleepUntil` in the future are hidden from the board but visible in the Tasks view.

### 6.4 Tasks View

- A flat, filterable list of every task in the project.
- For **all projects**: this is always available and shows every task in a flat list.
- When **kanban is enabled**: provides additional column-based filtering/grouping and shows archived/sleeping tasks that
  are hidden from the kanban board.
- When **kanban is disabled**: serves as the primary and only active view.
- Supports sorting and grouping options (by column, due date, created date, etc.).

### 6.5 Task Detail

- Opens as a side panel or modal.
- Editable fields: title, emoji, description (rich text or markdown), color, due date, sleep date, tags, subtasks,
  notes.
- Subtasks: ordered list, each with title + checkbox. Reorderable.
- Actions: mark complete, archive, delete, move to column.

### 6.6 Search

- **Project-scoped search**: full-text search across task titles, descriptions, and notes within the current project.
- **Workspace-scoped search**: same, but across all projects.
- Implemented on the frontend against the in-memory Automerge document state (no external search index needed for V1
  data volumes).

### 6.7 Command Palette

- Global shortcut (e.g., `Cmd+K` / `Ctrl+K`) opens a fuzzy-search command palette.
- Commands include: navigate to project, create task, search, toggle view, open settings, export, etc.
- Extensible command registry pattern for easy feature additions.

### 6.8 Keyboard Navigation

- Full keyboard navigation across all views:
  - Arrow keys to move between tasks/columns.
  - `Enter` to open task detail, `Escape` to close.
  - Shortcuts for common actions (new task, archive, complete, move between columns).
- Focus management: visible focus indicators, logical tab order.
- Shortcut reference accessible via `?` or command palette.

### 6.9 Export

- **Export Project → JSON**: serializes a single project (with all tasks, columns, tags) to a JSON file. Saved via
  Tauri's file dialog.
- **Export Workspace → JSON**: serializes the entire workspace.
- JSON schema is documented so it can serve as an import format in the future.

### 6.10 Background Processes

- **Auto-archive**: a periodic check (e.g., every minute or on app/tab focus) scans kanban columns with `autoArchive`
  enabled and archives tasks that have exceeded the configured duration. Runs as a JS interval/visibility-event handler.
- **Snooze date reveal**: same periodic check unhides tasks whose `sleepUntil` date has passed.

---

## 7. Out of Scope (V1)

- Authentication / user accounts
- Cloud sync (central cloud server)
- Multi-workspace support
- Real-time collaboration
- File attachments on tasks (beyond project-level images)
- Whiteboards (planned, not V1)
- Obsidian-style markdown notes per project (planned, not V1)
- Notifications / reminders
- Import from other tools
- Mobile-specific gesture navigation (beyond standard Tauri mobile support)

---

## 8. Non-Functional Requirements

| Concern          | Target                                                        |
|------------------|---------------------------------------------------------------|
| Startup time     | < 1s to interactive on desktop                                |
| Data persistence | All changes persisted within 500ms of user action             |
| Bundle size      | < 10 MB installer (desktop)                                   |
| Offline          | 100% functional with no network                               |
| Accessibility    | WCAG 2.1 AA (keyboard nav, screen reader support, contrast)   |
| Platforms        | Web (any modern browser), macOS, Windows, Linux, iOS, Android |

---

## 9. Project Structure

```
src-tauri/                        # Tauri shell (minimal, no app logic)
src/components/ui/                # Reusable UI primitives
src/components/kanban/            # Kanban board, columns, cards
src/components/tasks/             # Tasks list view
src/components/task-detail/       # Task detail dialog, subtasks, dates
src/components/command-palette/   # Fuzzy-search command palette
src/components/home/              # Home view, project cards
src/components/project/           # Project view, header, settings
src/components/sidebar/           # App sidebar navigation
src/components/settings/          # App settings, theme selector
src/components/sync/              # Export/import UI
src/components/upcoming/          # Upcoming tasks view
src/components/workspaces/        # Workspace management
src/components/help/              # Help dialog
src/hooks/                        # React hooks (workspace, keyboard, theme)
src/stores/                       # Zustand stores (navigation, settings, dialogs)
src/lib/automerge/                # Automerge-repo setup, document helpers
src/lib/commands/                 # Command palette registry and definitions
src/lib/exports/                  # JSON, CSV, Kanri exporters
src/lib/imports/                  # JSON, Kanri importers and schemas
src/lib/search/                   # Fuzzy matching, task search
src/lib/sync/                     # Sync protocol (planned)
src/types/                        # TypeScript type definitions
```

---

## 10. Next Steps

This document serves as the technical foundation. The next phase is to produce focused **PRDs (Product Requirements
Documents)** for each feature area, which will include:

- Detailed user stories and acceptance criteria
- UI wireframes / design specs
- API contract (Tauri IPC commands)
- Edge cases and error handling
- Implementation sequence and dependencies

### Suggested PRD Breakdown

1. **PRD-01**: Workspace & Project Management (CRUD, settings, navigation), theming (light, dark, +1 more) (DONE)
2. **PRD-02**: Task Model, Tasks View (flat list, filtering, sorting), Task add (just the title in the list), Task
   Detail modal, task completion (DONE)
3. **PRD-03**: Task editing (inline task editing from task detail modal), subtasks (editing, completing) (DONE)
4. **PRD-04**: Kanban View (columns, column drag-and-drop, task drag and drop, filtering) (DONE)
5. **PRD-05**: Search & Command Palette (DONE)
6. **PRD-06**: Keyboard Navigation & Accessibility
7. **PRD-07**: Export and Import (JSON) (DONE)
8. **PRD-08**: Background Processes (auto-archive, sleep date) (DONE)
9. **PRD-09**: Project Theming (backgrounds, colors, logos) (DONE)
10. **PRD-10**: Platform Packaging (Web deploy with PWA, Tauri desktop, Tauri mobile)
11. **PRD-11**: Project settings view (change name, toggle kanban, project brief) (DONE)
12. **PRD-12**: Multi-Workspace (DONE)
13. **PRD-13**: Open-source sync server
