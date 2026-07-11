import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { extractTextFromMessage } from '../extractTextFromMessage';

describe('extractTextFromMessage', () => {
  test('should extract text from text-only message', () => {
    const message: ParsedPart[] = [{ type: 'text', content: 'Hello world' }];
    expect(extractTextFromMessage(message)).toBe('Hello world');
  });

  test('should convert emotes back to text', () => {
    const message: ParsedPart[] = [
      { type: 'text', content: 'Hello ' },
      {
        type: 'emote',
        content: 'Kappa',
        name: 'Kappa',
        original_name: 'Kappa',
        id: 'emote-1',
        url: 'https://example.com/kappa.png',
      },
      { type: 'text', content: ' World' },
    ];
    expect(extractTextFromMessage(message)).toBe('Hello Kappa World');
  });

  test('should preserve mentions', () => {
    const message: ParsedPart[] = [
      { type: 'text', content: 'Hello ' },
      {
        type: 'mention',
        content: '@user',
        color: '#FF0000',
      },
      { type: 'text', content: ' World' },
    ];
    expect(extractTextFromMessage(message)).toBe('Hello @user  World');
  });

  test('should handle empty message array', () => {
    expect(extractTextFromMessage([])).toBe('');
  });

  test('should handle multiple emotes', () => {
    const message: ParsedPart[] = [
      {
        type: 'emote',
        content: 'Kappa',
        name: 'Kappa',
        original_name: 'Kappa',
        id: 'emote-1',
        url: 'https://example.com/kappa.png',
      },
      { type: 'text', content: ' ' },
      {
        type: 'emote',
        content: 'PogChamp',
        name: 'PogChamp',
        original_name: 'PogChamp',
        id: 'emote-2',
        url: 'https://example.com/pogchamp.png',
      },
    ];
    expect(extractTextFromMessage(message)).toBe('Kappa PogChamp');
  });
});
