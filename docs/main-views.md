# Main Views

## Navigation Model

Zustand store (`useNavigation`) drives a two-level routing system. No URL router — view state is in-memory.

**Top-level views:** Home, Upcoming, Project, Settings, Sync
**Project sub-views:** Kanban, Tasks, Settings

Routing lives in `src/components/app-shell.tsx`. Before any workspace is selected, the app shows `WorkspacesScreen`.

---

## Views at a Glance

| View             | Entry point                        | Purpose                                             |
|------------------|------------------------------------|-----------------------------------------------------|
| Home             | `home/home-view.tsx`               | Project grid with cards, creation wizard            |
| Upcoming         | `upcoming/upcoming-view.tsx`       | Cross-project tasks grouped by date bucket          |
| Kanban           | `kanban/kanban-view.tsx`           | Column-based board (only when `kanbanEnabled`)      |
| Tasks            | `tasks/tasks-view.tsx`             | Flat task list with sort/filter                     |
| Project Settings | `project/project-settings.tsx`     | Per-project config (columns, tags, theme)           |
| Settings         | `settings/settings-view.tsx`       | Global app settings and theme                       |
| Sync             | `sync/sync-view.tsx`               | Tabbed: Sync servers / Import / Export              |
| Workspaces       | `workspaces/workspaces-screen.tsx` | Workspace picker (shown before workspace selection) |

---

## Home

Displays all projects as a card grid. Each card shows title, logo, background, and task count. Cards are reorderable via
drag-and-drop and navigable via keyboard grid navigation (`useGridNavigation`).

**Project creation** uses a multi-step wizard (`home/project-wizard/`) with paths: create blank, use template, import,
or clone existing.

**Project previews:** Each card displays a canvas-rendered miniature of the project's kanban board or task list. Previews
are generated in `src/lib/preview-cache.ts` using OffscreenCanvas and cached in two layers (in-memory Map + OPFS). The
hook `src/hooks/use-project-preview.tsx` drives per-card generation with semaphore-gated concurrency and
fingerprint-based invalidation. Changes to how tasks, columns, or tags are displayed in the Kanban or Tasks view should
be reflected in the corresponding canvas drawing functions in `preview-cache.ts`.

## Upcoming

Aggregates tasks with due dates across all projects. Groups them into date buckets: overdue, today, tomorrow, this week,
next week, later. Filters by project, search text, snoozed status, and tags (aggregated across projects).

## Kanban

Renders columns from `project.columns`. Tasks are draggable between columns and reorderable within a column (DnD Kit).
Snoozed tasks are hidden from the board. Each column supports auto-complete and optional task limits.

**Toolbar filters:** search, completed status, snoozed toggle, tag filter (AND logic), hidden columns toggle.

## Tasks

Flat list of all tasks in the project. Always available regardless of kanban status. Shows archived and snoozed tasks
that the kanban board hides.

**Sort options:** manual (drag), created date, due date, alphabetical.
**Filters:** same as kanban plus archived toggle.

## Task Detail

Opens as a dialog (`task-detail/task-detail-dialog.tsx`) from any view. State managed by `useTaskDetailModalState`.

Editable fields: title, emoji, description, notes, color, column, due date, snooze date, tags, subtasks.

## Command Palette

`Cmd/Ctrl+K` opens a fuzzy-search palette (`command-palette/command-palette-dialog.tsx`). Modes:

- Default — registered commands (navigation, view toggles, system)
- `#` prefix — search tasks in current project
- `@` prefix — search tasks across workspace

Commands are registered in `src/lib/commands/registry.ts`.
