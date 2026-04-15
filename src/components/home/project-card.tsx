import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Project } from "@/types/data-model";
import { useEffect, useState, type HTMLAttributes } from "react";
import { useProjectPreview } from "@/hooks/use-project-preview";
import { loadImage } from "@/lib/utils/opfs.ts";

type ProjectCardProps = HTMLAttributes<HTMLDivElement> & {
  project: Project;
  workspaceId: string;
  onClick: () => void;
  onDelete: () => void;
};

function ProjectCardPreview({
  previewUrl,
  loading,
}: {
  previewUrl: string | null;
  loading: boolean;
}) {
  if (loading && !previewUrl) {
    return <div className="project-card-preview project-card-preview--loading" />;
  }

  if (previewUrl) {
    return (
      <div className="project-card-preview">
        <img src={previewUrl} alt="" className="project-card-preview-image" />
      </div>
    );
  }

  return <div className="project-card-preview project-card-preview--empty" />;
}

function ProjectAvatar({
  logoUrl,
  title,
}: {
  logoUrl: string | null;
  title: string;
}) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" className="project-card-avatar" />;
  }

  const letter = title.trim().charAt(0).toUpperCase() || "?";
  return <div className="project-card-avatar project-card-avatar--letter">{letter}</div>;
}

function ProjectCardFooter({
  title,
  taskCountText,
  logoUrl,
  onDelete,
}: {
  title: string;
  taskCountText: string;
  logoUrl: string | null;
  onDelete: () => void;
}) {
  return (
    <div className="project-card-footer">
      <ProjectAvatar logoUrl={logoUrl} title={title} />
      <div className="project-card-info">
        <h3 className="project-card-title">{title}</h3>
        <p className="project-card-count">{taskCountText}</p>
      </div>
      <button
        className="project-card-delete"
        aria-label={`Delete ${title}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function ProjectCard({
  project,
  workspaceId,
  onClick,
  onDelete,
  ...props
}: ProjectCardProps) {
  const { t } = useTranslation("projects");
  const { previewUrl, loading } = useProjectPreview(workspaceId, project);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!project.logoVersion) {
      setLogoUrl(null);
      return;
    }
    let revoked = false;
    loadImage(workspaceId, project.logoVersion).then((url) => {
      if (!revoked) setLogoUrl(url);
    });
    return () => {
      revoked = true;
      setLogoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [workspaceId, project.logoVersion]);

  return (
    <div className="project-card" role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }} {...props}>
      <ProjectCardPreview previewUrl={previewUrl} loading={loading} />
      <ProjectCardFooter
        title={project.title}
        taskCountText={t("taskCount", { count: Object.keys(project.tasks).length })}
        logoUrl={logoUrl}
        onDelete={onDelete}
      />
    </div>
  );
}
