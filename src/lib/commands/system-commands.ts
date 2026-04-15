import { Languages } from 'lucide-react';
import i18n from '@/i18n';
import type { CommandRegistry } from './registry';

export function registerSystemCommands(registry: CommandRegistry): void {
  registry.register({
    id: 'system.changeLanguage',
    get title() { return i18n.t("changeLanguage", { ns: "commands" }); },
    get description() { return i18n.t("changeLanguageDescription", { ns: "commands" }); },
    category: 'system',
    keywords: ['language', 'locale', 'translate', 'i18n', 'english', 'settings'],
    icon: Languages,
    isAvailable: () => true,
    execute: ({ hideCommandPalette, navigate, workspaceId }) => {
      hideCommandPalette();
      navigate({ to: '/w/$workspaceId/settings', params: { workspaceId } });
    },
  });
}
