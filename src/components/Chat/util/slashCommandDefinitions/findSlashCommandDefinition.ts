import { SLASH_COMMAND_DEFINITIONS } from '@app/components/Chat/util/slashCommandDefinitions/SLASH_COMMAND_DEFINITIONS';
import type { SlashCommandDefinition } from '@app/components/Chat/util/slashCommandDefinitions/types';

/**
 * Looks up a definition by command name or alias (without the leading slash),
 * case-insensitively. Returns undefined for unknown commands.
 */
export function findSlashCommandDefinition(
  command: string,
): SlashCommandDefinition | undefined {
  const lower = command.toLowerCase();
  return SLASH_COMMAND_DEFINITIONS.find(
    definition =>
      definition.name === lower || definition.aliases?.includes(lower),
  );
}
