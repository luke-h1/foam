import { SLASH_COMMAND_DEFINITIONS } from '@app/components/chat/util/slash-command-definitions/slashCommandDefinitions';
import type { SlashCommandDefinition } from '@app/components/chat/util/slash-command-definitions/types';

export function findSlashCommandDefinition(
  command: string,
): SlashCommandDefinition | undefined {
  const lower = command.toLowerCase();
  return SLASH_COMMAND_DEFINITIONS.find(
    definition =>
      definition.name === lower || definition.aliases?.includes(lower),
  );
}
