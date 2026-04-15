# Command Palette

The command palette (`Cmd+K` / `Ctrl+K`) provides quick access to navigation, view switching, and task search. Commands
are registered in `src/lib/commands/` and dynamic commands (projects, workspaces) are generated in the dialog component.
It supports three modes: commands (default), project search (`#` prefix), and workspace search (`@` prefix).

## Rules

- All command palette items must have an icon.
- Dynamic commands (projects, workspaces) are generated in `src/components/command-palette/command-palette-dialog.tsx`;
  static commands are registered in `src/lib/commands/`.
- Icons come from `lucide-react`.
