import type { MessageToken } from '@app/utils/chat/message-token';

export function createTextToken(
  content: string,
  overrides: Partial<MessageToken<'text'>> = {},
): MessageToken<'text'> {
  return {
    type: 'text',
    content,
    ...overrides,
  };
}

export function createEmoteToken(
  content: string,
  overrides: Partial<MessageToken<'emote'>> = {},
): MessageToken<'emote'> {
  return {
    type: 'emote',
    content,
    name: content,
    original_name: content,
    url: `https://cdn.example.test/${content}.webp`,
    ...overrides,
  };
}
