import type { ParsedActionMessage } from '@app/utils/chat/parseActionMessage/types';

const ACTION_COMMAND = /^\/me(?:\s+|$)/i;

export function parseActionCommand(input: string): ParsedActionMessage {
  const match = ACTION_COMMAND.exec(input);
  if (match) {
    return { isAction: true, text: input.slice(match[0].length) };
  }

  return { isAction: false, text: input };
}
