import type { Command, CommandContext } from './types';
import { fuzzyMatch } from '../search/fuzzy-match';

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  getAll(context: CommandContext): Command[] {
    return Array.from(this.commands.values())
      .filter(cmd => cmd.isAvailable(context));
  }

  search(query: string, context: CommandContext): Command[] {
    const available = this.getAll(context);
    if (!query.trim()) {
      return available;
    }
    return fuzzyMatch(available, query);
  }
}

export const commandRegistry = new CommandRegistry();
