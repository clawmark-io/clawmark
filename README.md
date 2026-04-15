# Clawmark

A desktop task management app that scales from a simple personal to-do list to managing complex processes with Kanban
boards. Built with Tauri 2, React 19, and TypeScript.

Fully offline-first with optional CRDT-based sync — connect to your own self-hosted server or a cloud service, or use
multiple servers at once.

**Homepage:** [clawmark.io](https://clawmark.io)

## Features

- **Kanban board** — drag-and-drop columns with per-column colors, WIP limits, auto-complete, and hidden column support
- **Task list view** — flat list with sorting and filtering
- **Upcoming view** — cross-project tasks grouped by time bucket (overdue, today, this week, later)
- **Task details** — title, description, emoji, color, due date, snooze, tags, and subtasks
- **Workspaces & projects** — organize work into isolated workspaces, each with multiple projects, templates, and
  per-project visuals
- **Themes** — 5 built-in themes plus a fully custom theme editor with ~20 color variables
- **Command palette** — `Cmd/Ctrl+K` with fuzzy search across commands, project tasks, and workspace-wide tasks
- **Keyboard shortcuts** — single-key navigation; press `F1` to see the full list
- **Sync** — CRDT-based (Automerge) over WebSocket with automatic conflict resolution; configure multiple self-hosted or
  cloud sync servers per workspace
- **Import & export** — JSON (full workspace or project), Kanri, CSV (export and import); Asana, Trello, and Jira import
  coming soon

## Tech Stack

- [Tauri 2](https://tauri.app/) — lightweight desktop wrapper
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) — frontend
- [Vite](https://vite.dev/) — build tooling
- [Tailwind CSS 4](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/) — styling
- [Automerge](https://automerge.org/) — CRDT for conflict-free sync
- [Zustand](https://zustand.docs.pmnd.rs/) — state management
- [DnD Kit](https://dndkit.com/) — drag-and-drop

## Building

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install)
- Tauri 2 prerequisites — see the [Tauri docs](https://v2.tauri.app/start/prerequisites/)

### Development

```bash
npm install
npm run tauri dev
```

This starts the Vite dev server and opens the Tauri window.

### Production Build

```bash
npm run tauri build
```

Produces platform-specific installers in `src-tauri/target/release/bundle/`.

To validate the frontend build only:

```bash
npm run build
```

## Author

**Przemyslaw Grzywacz** — [clawmark.io](https://clawmark.io)
