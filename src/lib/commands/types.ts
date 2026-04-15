import type { Workspace } from '@/types/data-model';
import type { ComponentType } from 'react';
import type { NavigateFn } from '@tanstack/react-router';

export type CommandCategory = 'navigation' | 'tasks' | 'views' | 'search' | 'system' | 'workspace';

export type ProjectView = 'kanban' | 'tasks' | 'settings';

export type Command = {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  keywords: string[];
  icon?: ComponentType<{ className?: string }>;
  shortcut?: string;
  isAvailable: (context: CommandContext) => boolean;
  execute: (context: CommandContext) => void | Promise<void>;
};

export type CommandContext = {
  workspace: Workspace | undefined;
  currentProjectId: string | null;
  currentView: string;
  projectView: ProjectView;
  navigate: NavigateFn;
  workspaceId: string;
  hideCommandPalette: () => void;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: () => void;
  createProject: () => void;
};
