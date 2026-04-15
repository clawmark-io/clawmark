import { Columns3, List, Settings } from 'lucide-react';
import i18n from '@/i18n';
import type { CommandRegistry } from './registry';
import type { CommandContext } from './types';

export function registerViewCommands(registry: CommandRegistry): void {
  registry.register({
    id: 'view.kanban',
    get title() { return i18n.t("switchToKanbanView", { ns: "commands" }); },
    get description() { return i18n.t("switchToKanbanViewDescription", { ns: "commands" }); },
    category: 'views',
    keywords: ['kanban', 'board', 'columns', 'view', 'switch'],
    icon: Columns3,
    isAvailable: ({ workspace, currentProjectId }: CommandContext) => {
      if (!currentProjectId) return false;
      const project = workspace?.projects[currentProjectId];
      return project?.kanbanEnabled ?? false;
    },
    execute: ({ navigate, workspaceId, currentProjectId, hideCommandPalette }: CommandContext) => {
      hideCommandPalette();
      if (currentProjectId) {
        navigate({ to: '/w/$workspaceId/p/$projectId/kanban', params: { workspaceId, projectId: currentProjectId } });
      }
    },
  });

  registry.register({
    id: 'view.tasks',
    get title() { return i18n.t("switchToTasksView", { ns: "commands" }); },
    get description() { return i18n.t("switchToTasksViewDescription", { ns: "commands" }); },
    category: 'views',
    keywords: ['tasks', 'list', 'view', 'switch', 'all'],
    icon: List,
    isAvailable: ({ currentProjectId }: CommandContext) => currentProjectId !== null,
    execute: ({ navigate, workspaceId, currentProjectId, hideCommandPalette }: CommandContext) => {
      hideCommandPalette();
      if (currentProjectId) {
        navigate({ to: '/w/$workspaceId/p/$projectId/tasks', params: { workspaceId, projectId: currentProjectId } });
      }
    },
  });

  registry.register({
    id: 'view.settings',
    get title() { return i18n.t("openProjectSettings", { ns: "commands" }); },
    get description() { return i18n.t("openProjectSettingsDescription", { ns: "commands" }); },
    category: 'views',
    keywords: ['settings', 'config', 'project', 'edit'],
    icon: Settings,
    isAvailable: ({ currentProjectId }: CommandContext) => currentProjectId !== null,
    execute: ({ navigate, workspaceId, currentProjectId, hideCommandPalette }: CommandContext) => {
      hideCommandPalette();
      if (currentProjectId) {
        navigate({ to: '/w/$workspaceId/p/$projectId/settings', params: { workspaceId, projectId: currentProjectId } });
      }
    },
  });
}
