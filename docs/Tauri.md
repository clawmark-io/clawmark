# Tauri

The app runs as both a Tauri desktop window and a plain browser tab. Tauri APIs (`@tauri-apps/`) are only available in the desktop context.

## Rules

- **Never** use static top-level imports from `@tauri-apps/*` in code that runs in the browser. Use dynamic `await import(...)` inside functions instead.
- **Always** guard Tauri-dependent code with `isTauri()` (from `@tauri-apps/api/core`) and return early when it's `false`.
- The one exception: importing `isTauri` itself is safe as a static import since it only checks for `window.__TAURI_INTERNALS__`.

## Pattern

```ts
import { isTauri } from "@tauri-apps/api/core";

async function doSomethingNative() {
  if (!isTauri()) return;
  const { someApi } = await import("@tauri-apps/some-package");
  await someApi();
}
```
