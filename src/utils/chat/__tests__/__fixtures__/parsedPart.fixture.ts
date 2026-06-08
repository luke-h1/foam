import type { ParsedPart } from '../../replaceTextWithEmotes';

export function createTextPart(
  content: string,
  overrides: Partial<ParsedPart<'text'>> = {},
): ParsedPart<'text'> {
  return {
    type: 'text',
    content,
    ...overrides,
  };
}

export function createEmotePart(
  content: string,
  overrides: Partial<ParsedPart<'emote'>> = {},
): ParsedPart<'emote'> {
  return {
    type: 'emote',
    content,
    name: content,
    original_name: content,
    url: `https://cdn.example.test/${content}.webp`,
    ...overrides,
  };
}

export function createMentionPart(
  content: string,
  overrides: Partial<ParsedPart<'mention'>> = {},
): ParsedPart<'mention'> {
  return {
    type: 'mention',
    content,
    ...overrides,
  };
}
