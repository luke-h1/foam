import { REFRESH_COMMAND } from '@app/components/Chat/util/slashCommandDefinitions/REFRESH_COMMAND';

/**
 * Matches `/refresh` on the first token so trailing text is tolerated,
 * mirroring `parseModCommand`'s argument-less commands.
 */
export function isRefreshCommand(input: string): boolean {
  const [firstToken = ''] = input.trim().toLowerCase().split(/\s+/);
  return firstToken === REFRESH_COMMAND;
}
