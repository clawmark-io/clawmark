import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { branding } from "@/lib/branding";
import { useTranslation } from "react-i18next";

type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{branding.appName}</DialogTitle>
          <DialogDescription>
            {branding.tagline}
          </DialogDescription>
        </DialogHeader>
        <div className="about-dialog-section">
          <div className="about-dialog-section-title">{t("websitesLabel")}</div>
          <div className="about-dialog-link-list">
            <a href={branding.website} target="_blank" rel="noopener noreferrer">
              {branding.domain}
            </a>
            <a href={branding.github} target="_blank" rel="noopener noreferrer">
              {t("github")}
            </a>
          </div>
        </div>
        <div className="text-sm opacity-60">
          {t("versionLabel", { version: branding.version })}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
