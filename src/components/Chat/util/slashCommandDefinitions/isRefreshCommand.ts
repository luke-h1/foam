import { REFRESH_COMMAND } from '@app/components/Chat/util/slashCommandDefinitions/REFRESH_COMMAND';

/**
 * True when the input invokes `/refresh`. Matches on the first token so
 * trailing text is tolerated, mirroring how `parseModCommand` treats other
 * argument-less commands like `/slowoff`.
 */
export function isRefreshCommand(input: string): boolean {
  const [firstToken = ''] = input.trim().toLowerCase().split(/\s+/);
  return firstToken === REFRESH_COMMAND;
}
