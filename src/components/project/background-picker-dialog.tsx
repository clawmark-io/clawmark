import { useState, useEffect, useRef } from "react";
import { ImageOff, Upload } from "lucide-react";
import { useWorkspace } from "@/stores/workspace-context";
import { loadImage } from "@/lib/utils/opfs.ts";
import { hasBackground } from "@/types/data-model";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BackgroundPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjectId: string;
  onSelectBackground: (fromProjectId: string) => void;
  onRemoveBackground: () => void;
  onUploadBackground: (file: File) => void;
};

export function BackgroundPickerDialog({
  open,
  onOpenChange,
  currentProjectId,
  onSelectBackground,
  onRemoveBackground,
  onUploadBackground,
}: BackgroundPickerDialogProps) {
  const { workspace, workspaceId } = useWorkspace();
  const [bgUrls, setBgUrls] = useState<Record<string, string>>({});
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !workspace) {
      return;
    }

    const urls: Record<string, string> = {};
    let cancelled = false;

    const projects = Object.values(workspace.projects).filter((p) => hasBackground(p));

    Promise.all(
      projects.map(async (p) => {
        const url = p.backgroundVersion ? await loadImage(workspaceId, p.backgroundVersion) : null;
        if (url && !cancelled) {
          urls[p.id] = url;
        }
      }),
    ).then(() => {
      if (!cancelled) {
        setBgUrls({ ...urls });
      }
    });

    return () => {
      cancelled = true;
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
      setBgUrls({});
    };
  }, [open, workspace, workspaceId]);

  if (!workspace) return null;

  const projectsWithBg = Object.values(workspace.projects).filter((p) => hasBackground(p));

  const handleSelect = (projectId: string) => {
    if (projectId === currentProjectId) {
      onOpenChange(false);
      return;
    }
    onSelectBackground(projectId);
    onOpenChange(false);
  };

  const handleNoBackground = () => {
    onRemoveBackground();
    onOpenChange(false);
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBackground(file);
      onOpenChange(false);
    }
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose background</DialogTitle>
        </DialogHeader>
        <div className="max-h-[24rem] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NoBackgroundCard onClick={handleNoBackground} />
            {projectsWithBg.map((p) => (
              <BackgroundCard
                key={p.id}
                title={p.title}
                imageUrl={bgUrls[p.id] ?? null}
                isCurrent={p.id === currentProjectId}
                onClick={() => handleSelect(p.id)}
              />
            ))}
            <UploadCard onClick={() => uploadInputRef.current?.click()} />
          </div>
        </div>
        <input
          ref={uploadInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,.svg"
          className="hidden"
          onChange={handleUploadChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function NoBackgroundCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="bg-picker-card"
      onClick={onClick}
    >
      <div className="bg-picker-card__preview">
        <ImageOff size={24} className="text-[var(--text-muted)]" />
      </div>
      <span className="bg-picker-card__title">No background</span>
    </button>
  );
}

function BackgroundCard({
  title,
  imageUrl,
  isCurrent,
  onClick,
}: {
  title: string;
  imageUrl: string | null;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`bg-picker-card ${isCurrent ? "bg-picker-card--current" : ""}`}
      onClick={onClick}
    >
      <div className="bg-picker-card__preview">
        {imageUrl ? (
          <img src={imageUrl} alt="" />
        ) : (
          <div className="bg-picker-card__loading" />
        )}
      </div>
      <span className="bg-picker-card__title">{title}</span>
    </button>
  );
}

function UploadCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="bg-picker-card"
      onClick={onClick}
    >
      <div className="bg-picker-card__preview">
        <Upload size={24} className="text-[var(--text-muted)]" />
      </div>
      <span className="bg-picker-card__title">Upload new</span>
    </button>
  );
}
