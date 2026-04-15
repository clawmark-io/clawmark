import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

type HelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const shortcutGroups = [
  {
    titleKey: "shortcutGroupGlobal",
    shortcuts: [
      { keys: ["F1"], descriptionKey: "shortcutShowHelp" },
      { keys: ["Cmd/Ctrl", "K"], descriptionKey: "shortcutCommandPalette" },
    ],
  },
  {
    titleKey: "shortcutGroupNavigation",
    shortcuts: [
      { keys: ["`"], descriptionKey: "shortcutGoHome" },
      { keys: ["U"], descriptionKey: "shortcutGoUpcoming" },
      { keys: ["1"], descriptionKey: "shortcutGoKanban" },
      { keys: ["2"], descriptionKey: "shortcutGoTasks" },
      { keys: ["0"], descriptionKey: "shortcutGoProjectSettings" },
    ],
  },
] as const;

function KeyboardKey({ children }: { children: string }) {
  return (
    <kbd className="kbd kbd-sm">
      {children}
    </kbd>
  );
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("keyboardShortcutsTitle")}</DialogTitle>
          <DialogDescription>
            {t("keyboardShortcutsDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.titleKey}>
              <h3 className="text-sm font-semibold mb-3 opacity-70">
                {t(group.titleKey)}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.descriptionKey}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-base-200"
                  >
                    <span className="text-sm opacity-60">
                      {t(shortcut.descriptionKey)}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <KeyboardKey key={key}>{key}</KeyboardKey>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
