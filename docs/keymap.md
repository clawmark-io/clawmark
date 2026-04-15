# Keymap

All keyboard shortcuts are defined in `src/components/app-shell.tsx` using the `useKeyboardShortcut` hook. The help dialog (`src/components/help/help-dialog.tsx`) mirrors these for display.

## Global

| Key | Action |
|-----|--------|
| `F1` | Show help dialog |
| `Cmd/Ctrl + K` | Open command palette |

## Navigation

| Key | Action |
|-----|--------|
| `` ` `` | Go to home screen |
| `U` | Go to upcoming view |
| `1` | Go to kanban view (when in a project, only if kanban is enabled) |
| `2` | Go to tasks view (when in a project) |
| `0` | Go to project settings (when in a project) |

## Command Palette Modes

| Prefix | Mode |
|--------|------|
| _(none)_ | Registered commands (navigation, view toggles, system) |
| `#` | Search tasks in current project |
| `@` | Search tasks across workspace |

## Implementation

- `src/hooks/use-keyboard-shortcut.ts` — Hook that binds key + modifiers to a callback. Skips plain-key shortcuts when focus is in a text field.
- `src/hooks/useGridNavigation.ts` — Arrow-key grid navigation for project cards on the home screen.
- `src/lib/commands/registry.ts` — Command palette command definitions and registry.
