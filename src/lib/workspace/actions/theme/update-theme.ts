import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, ThemeSettings } from "@/types/data-model";
import type { ThemeName } from "@/types/theme";

export function updateTheme(
  handle: DocHandle<Workspace>,
  theme: ThemeName,
): void {
  handle.change((doc) => {
    if (!doc.theme) doc.theme = { theme } as ThemeSettings;
    doc.theme.theme = theme;
    doc.updatedAt = Date.now();
  });
}
