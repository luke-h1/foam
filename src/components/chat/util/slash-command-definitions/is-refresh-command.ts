import { REFRESH_COMMAND } from '@app/components/chat/util/slash-command-definitions/refresh-command';

export function isRefreshCommand(input: string): boolean {
  const [firstToken = ''] = input.trim().toLowerCase().split(/\s+/);
  return firstToken === REFRESH_COMMAND;
}
