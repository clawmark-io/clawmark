# Debug Object

A `window.debug` object is exposed at startup (via `src/lib/devtools.ts`) for use in the browser console.

## Methods

| Method                        | Description                                                                    |
|-------------------------------|--------------------------------------------------------------------------------|
| `debug.setTheme(name)`        | Switch theme. Valid: `light`, `dark`, `darkish`, `alternative-light`, `custom` |
| `debug.setZoom(level)`        | Set page zoom (e.g. `1.5` for 150%)                                            |
| `debug.resizeForScreenshot()` | Resize Tauri window to 2560x1440 (Tauri-only)                                  |
| `debug.createTestWorkspace()` | Create a "Test Workspace" with 2 projects (Kanban + ToDo) and ~40 tasks. Renames any existing "Test Workspace" first. Returns a promise. |
