import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type ImageDropZoneProps = {
  imageUrl: string | null;
  onFileDrop: (file: File) => void;
  onClick: () => void;
  onRemove: (() => void) | null;
  label: string;
};

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

export function ImageDropZone({ imageUrl, onFileDrop, onClick, onRemove, label }: ImageDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_TYPES.has(file.type)) {
      onFileDrop(file);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const zoneClass = [
    "image-drop-zone",
    isDragOver ? "image-drop-zone--drag-over" : "",
    imageUrl ? "image-drop-zone--has-image" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      role="button"
      tabIndex={0}
      className={zoneClass}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {imageUrl ? (
        <DropZonePreview src={imageUrl} onRemove={onRemove ? handleRemoveClick : null} />
      ) : (
        <DropZonePlaceholder label={label} />
      )}
    </div>
  );
}

function DropZonePlaceholder({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <div className="image-drop-zone__placeholder">
      <ImagePlus size={24} />
      <span className="text-xs">{t("dropOrBrowse", { label: label.toLowerCase() })}</span>
    </div>
  );
}

function DropZonePreview({ src, onRemove }: { src: string; onRemove: ((e: React.MouseEvent) => void) | null }) {
  return (
    <>
      <img src={src} alt="" />
      {onRemove ? (
        <button
          className="btn btn-xs btn-circle btn-error absolute -top-1.5 -right-1.5"
          onClick={onRemove}
        >
          <X size={12} />
        </button>
      ) : null}
    </>
  );
}
