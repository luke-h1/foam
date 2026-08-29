import { REFRESH_COMMAND } from '@app/components/Chat/util/slashCommandDefinitions/REFRESH_COMMAND';

export function isRefreshCommand(input: string): boolean {
  const [firstToken = ''] = input.trim().toLowerCase().split(/\s+/);
  return firstToken === REFRESH_COMMAND;
}
