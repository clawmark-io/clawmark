import type { ReactNode } from "react";
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";

type ProjectHeaderProps = {
  title: string;
  logoUrl?: string | null;
  rightContent?: ReactNode;
};

export function ProjectHeader({ title, logoUrl, rightContent }: ProjectHeaderProps) {
  return (
    <header className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <SidebarToggle />
        {logoUrl ? (
          <img src={logoUrl} alt="" className="project-logo" />
        ) : null}
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {rightContent ? (
        <div className="flex gap-2 items-center">
          {rightContent}
        </div>
      ) : null}
    </header>
  );
}
