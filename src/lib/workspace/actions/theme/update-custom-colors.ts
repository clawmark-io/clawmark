import type { DocHandle } from "@automerge/automerge-repo";
import type { Workspace, ThemeSettings } from "@/types/data-model";
import type { CustomThemeColors } from "@/types/theme";

export function updateCustomColors(
  handle: DocHandle<Workspace>,
  colors: CustomThemeColors,
): void {
  handle.change((doc) => {
    if (!doc.theme) doc.theme = { theme: "custom" } as ThemeSettings;
    doc.theme.customColors = colors;
    doc.updatedAt = Date.now();
  });
}
