import type { MessageToken } from '@app/types/chat/messageToken';

export function parseMessageText(
  text: string | undefined,
  parseTextForEmotes?: (text: string) => MessageToken[],
): MessageToken[] {
  const trimmed = text?.trim();

  if (!trimmed) {
    return [];
  }

  const parsed = parseTextForEmotes?.(trimmed);

  return parsed && parsed.length > 0
    ? parsed
    : [{ type: 'text', content: trimmed }];
}
