import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, FolderOpen, Plus } from 'lucide-react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Command as CommandPrimitive, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCommandPaletteState } from '@/stores/command-palette';
import { useOptionalWorkspace } from '@/stores/workspace-context';
import { useManager } from '@/stores/manager-context';
import { useStore } from '@/hooks/use-store';
import { useCreateProjectModalState } from '@/stores/create-project';
import { commandRegistry } from '@/lib/commands/registry';
import { registerNavigationCommands } from '@/lib/commands/navigation-commands';
import { registerViewCommands } from '@/lib/commands/view-commands';
import { registerSystemCommands } from '@/lib/commands/system-commands';
import { searchTasks } from '@/lib/search/task-search';
import type { Command, CommandCategory, ProjectView } from '@/lib/commands/types';
import type { TaskSearchResult } from '@/lib/search/task-search';

type CommandPaletteMode = 'commands' | 'search-project' | 'search-workspace';

// Register commands once on module load
registerNavigationCommands(commandRegistry);
registerViewCommands(commandRegistry);
registerSystemCommands(commandRegistry);

export function CommandPaletteDialog() {
  const { t } = useTranslation("commands");
  const { visible, initialMode, hide } = useCommandPaletteState();
  const workspaceCtx = useOptionalWorkspace();
  const workspace = workspaceCtx?.workspace;
  const workspaceId = workspaceCtx?.workspaceId;
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const manager = useManager();
  const allWorkspaces = useStore(manager.workspaces);
  const { showCreateProject } = useCreateProjectModalState();

  // Derive projectId from URL
  const projectMatch = pathname.match(/\/p\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;

  // Derive view from URL
  let view = "home";
  let projectView: ProjectView = "kanban";
  if (pathname.includes("/upcoming")) view = "upcoming";
  else if (pathname.includes("/settings") && !pathname.includes("/p/")) view = "settings";
  else if (pathname.includes("/sync") && !pathname.includes("/p/")) view = "sync";
  else if (projectId) {
    view = "project";
    if (pathname.includes("/kanban")) projectView = "kanban";
    else if (pathname.includes("/tasks")) projectView = "tasks";
    else if (pathname.includes("/settings")) projectView = "settings";
  }

  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<CommandPaletteMode>('commands');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setSearch('');
    }
  }, [visible, initialMode]);

  // Detect mode from query prefix
  useEffect(() => {
    if (search.startsWith('#')) {
      setMode('search-project');
    } else if (search.startsWith('@')) {
      setMode('search-workspace');
    } else if (mode !== 'commands') {
      // Only switch back to commands if we're not already there
      // This prevents switching mode when user types regular text
      if (!search.startsWith('>') && (search.includes('#') || search.includes('@'))) {
        // Don't switch mode if the prefix is in the middle
        return;
      }
      setMode('commands');
    }
  }, [search, mode]);

  // Generate dynamic project navigation commands
  const projectCommands = useMemo((): Command[] => {
    if (!workspace) return [];
    const cmds: Command[] = Object.values(workspace.projects).map((project) => ({
      id: `nav.project.${project.id}`,
      title: t("goToProject", { title: project.title }),
      description: project.description || undefined,
      category: 'navigation' as const,
      keywords: ['go', 'project', 'open', project.title.toLowerCase()],
      icon: FolderOpen,
      isAvailable: () => true,
      execute: (ctx) => {
        ctx.hideCommandPalette();
        ctx.navigate({ to: '/w/$workspaceId/p/$projectId/kanban', params: { workspaceId: ctx.workspaceId, projectId: project.id } });
      },
    }));

    cmds.push({
      id: 'project.create',
      title: t("createNewProject"),
      category: 'navigation' as const,
      keywords: ['create', 'new', 'project', 'add'],
      icon: Plus,
      isAvailable: () => true,
      execute: (ctx) => {
        ctx.hideCommandPalette();
        ctx.createProject();
      },
    });

    return cmds;
  }, [workspace, t]);

  // Generate dynamic workspace switch commands
  const workspaceCommands = useMemo((): Command[] => {
    const cmds: Command[] = allWorkspaces
      .filter((w) => w.workspaceId !== workspaceId)
      .map((w) => ({
        id: `workspace.switch.${w.workspaceId}`,
        title: t("switchToWorkspace", { name: w.name }),
        category: 'workspace' as const,
        keywords: ['switch', 'workspace', w.name.toLowerCase()],
        icon: ArrowRightLeft,
        isAvailable: () => true,
        execute: (ctx) => {
          ctx.hideCommandPalette();
          ctx.switchWorkspace(w.workspaceId);
        },
      }));

    cmds.push({
      id: 'workspace.create',
      title: t("createNewWorkspace"),
      category: 'workspace' as const,
      keywords: ['create', 'new', 'workspace', 'add'],
      icon: Plus,
      isAvailable: () => true,
      execute: (ctx) => {
        ctx.hideCommandPalette();
        ctx.createWorkspace();
      },
    });

    return cmds;
  }, [allWorkspaces, workspaceId, t]);

  // Get search query without prefixes
  const cleanQuery = search.replace(/^[>#@]\s*/, '');

  // Get command context
  const context = useMemo(() => ({
    workspace,
    currentProjectId: projectId,
    currentView: view,
    projectView,
    navigate,
    workspaceId: workspaceId ?? "",
    hideCommandPalette: hide,
    switchWorkspace: (id: string) => navigate({ to: '/w/$workspaceId', params: { workspaceId: id } }),
    createWorkspace: () => navigate({ to: '/w' }),
    createProject: () => showCreateProject(),
  }), [workspace, projectId, view, projectView, navigate, workspaceId, hide, showCreateProject]);

  // Get results based on mode
  const { commands, taskResults } = useMemo(() => {
    if (mode === 'commands') {
      // Add dynamic project + workspace commands
      const allCommands = [...commandRegistry.search(cleanQuery, context), ...projectCommands, ...workspaceCommands];

      return {
        commands: allCommands.filter(cmd => cmd.isAvailable(context)),
        taskResults: undefined,
      };
    } else {
      const scope = mode === 'search-project' ? 'project' : 'workspace';
      return {
        commands: undefined,
        taskResults: searchTasks(workspace, cleanQuery, scope, projectId),
      };
    }
  }, [mode, cleanQuery, workspace, projectId, projectCommands, workspaceCommands, context]);

  // Handle command selection
  const handleCommandSelect = (command: Command) => {
    command.execute(context);
  };

  // Handle task selection
  const handleTaskSelect = (result: TaskSearchResult) => {
    hide();
    navigate({
      to: '/w/$workspaceId/p/$projectId/tasks/$taskId',
      params: { workspaceId: workspaceId!, projectId: result.projectId, taskId: result.task.id },
    });
  };

  // Group commands by category
  const groupedCommands = useMemo((): Record<CommandCategory, Command[]> => {
    if (!commands) return {} as Record<CommandCategory, Command[]>;

    return commands.reduce((acc, command) => {
      if (!acc[command.category]) {
        acc[command.category] = [];
      }
      acc[command.category].push(command);
      return acc;
    }, {} as Record<CommandCategory, Command[]>);
  }, [commands]);

  const categoryLabels: Record<CommandCategory, string> = useMemo(() => ({
    navigation: t("categoryNavigation"),
    views: t("categoryViews"),
    tasks: t("categoryTasks"),
    search: t("categorySearch"),
    system: t("categorySystem"),
    workspace: t("categoryWorkspaces"),
  }), [t]);

  const getPlaceholder = (m: CommandPaletteMode): string => {
    switch (m) {
      case 'commands':
        return t("commandsPlaceholder");
      case 'search-project':
        return t("searchProjectPlaceholder");
      case 'search-workspace':
        return t("searchWorkspacePlaceholder");
    }
  };

  const categories: CommandCategory[] = ['navigation', 'views', 'tasks', 'search', 'workspace', 'system'];

  return (
    <Dialog open={visible} onOpenChange={(open) => { if (!open) hide(); }}>
      <DialogContent className='translate-y-[-30vh] overflow-hidden p-0' showCloseButton={false}>
        <CommandPrimitive shouldFilter={mode === 'commands'}>
          <CommandInput
            placeholder={getPlaceholder(mode)}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {mode === 'commands' ? t("noCommandsFound") : t("noTasksFound")}
            </CommandEmpty>

            {mode === 'commands' && commands && (
          <>
            {categories.map((category) => {
              const categoryCommands = groupedCommands[category];
              if (!categoryCommands || categoryCommands.length === 0) {
                return null;
              }

              return (
                <CommandGroup key={category} heading={categoryLabels[category]}>
                  {categoryCommands.map((command) => {
                    const Icon = command.icon;
                    return (
                      <CommandItem
                        key={command.id}
                        value={command.id}
                        keywords={command.keywords}
                        onSelect={() => handleCommandSelect(command)}
                      >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        <div className="flex-1">
                          <div className="font-medium">{command.title}</div>
                          {command.description && (
                            <div className="text-sm text-muted-foreground">{command.description}</div>
                          )}
                        </div>
                        {command.shortcut && (
                          <CommandShortcut>{command.shortcut}</CommandShortcut>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </>
        )}

        {(mode === 'search-project' || mode === 'search-workspace') && taskResults && (
          <CommandGroup heading={t("tasksFound", { count: taskResults.length })}>
            {taskResults.map((result) => (
              <CommandItem
                key={result.task.id}
                value={result.task.id}
                onSelect={() => handleTaskSelect(result)}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {result.task.emoji && <span className="mr-2">{result.task.emoji}</span>}
                    {result.task.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {result.projectTitle} · {t("matchedIn", { matchType: result.matchType })}
                    {result.task.completed ? ` · ${t("completed")}` : ''}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
