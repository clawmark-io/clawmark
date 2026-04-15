import { Home, CalendarClock } from 'lucide-react';
import i18n from '@/i18n';
import type { CommandRegistry } from './registry';
import type { CommandContext } from './types';

export function registerNavigationCommands(registry: CommandRegistry): void {
  registry.register({
    id: 'nav.home',
    get title() { return i18n.t("goToHome", { ns: "commands" }); },
    get description() { return i18n.t("goToHomeDescription", { ns: "commands" }); },
    category: 'navigation',
    keywords: ['home', 'projects', 'workspace', 'back'],
    icon: Home,
    isAvailable: () => true,
    execute: ({ navigate, workspaceId, hideCommandPalette }: CommandContext) => {
      hideCommandPalette();
      navigate({ to: '/w/$workspaceId/projects', params: { workspaceId } });
    },
  });

  registry.register({
    id: 'nav.upcoming',
    get title() { return i18n.t("goToUpcoming", { ns: "commands" }); },
    get description() { return i18n.t("goToUpcomingDescription", { ns: "commands" }); },
    category: 'navigation',
    keywords: ['upcoming', 'due', 'schedule', 'deadline', 'calendar'],
    icon: CalendarClock,
    isAvailable: ({ workspace }: CommandContext) => workspace !== undefined,
    execute: ({ navigate, workspaceId, hideCommandPalette }: CommandContext) => {
      hideCommandPalette();
      navigate({ to: '/w/$workspaceId/upcoming', params: { workspaceId } });
    },
  });
}
