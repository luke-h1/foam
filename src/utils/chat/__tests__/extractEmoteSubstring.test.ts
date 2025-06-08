import { extractEmoteSubstring } from '../extractEmoteSubstring';

describe('extractEmoteSubstring', () => {
  test('should handle empty object input', () => {
    const input: Record<string, string[]> = {};
    const result = extractEmoteSubstring(input as unknown as string);
    expect(result).toEqual({});
  });

  test('should handle non-empty object input', () => {
    const input: Record<string, string[]> = { key: ['value'] };
    const result = extractEmoteSubstring(input as unknown as string);
    expect(result).toEqual({ key: ['value'] });
  });

  test('should handle single emote with single position', () => {
    const input = '123:0-4';
    const result = extractEmoteSubstring(input);
    expect(result).toEqual({
      '123': ['0-4'],
    });
  });

  test('should handle multiple emotes with single positions', () => {
    const input = '123:0-4,456:5-8';
    const result = extractEmoteSubstring(input);
    expect(result).toEqual({
      '123': ['0-4'],
      '456': ['5-8'],
    });
  });

  test('should handle single emote with multiple positions', () => {
    const input = '123:0-4,123:5-8';
    const result = extractEmoteSubstring(input);
    expect(result).toEqual({
      '123': ['0-4', '5-8'],
    });
  });

  test('should handle multiple emotes with multiple positions', () => {
    const input = '123:0-4,456:5-8,123:9-12,456:13-16';
    const result = extractEmoteSubstring(input);
    expect(result).toEqual({
      '123': ['0-4', '9-12'],
      '456': ['5-8', '13-16'],
    });
  });

  test('should handle malformed input with missing position', () => {
    const input = '123:';
    const result = extractEmoteSubstring(input);
    expect(result).toEqual({
      '123': [''],
    });
  });

  test('should handle malformed input with missing emote ID', () => {
    const input = ':0-4';
    const result = extractEmoteSubstring(input);
    expect(result).toEqual({
      '': [],
    });
  });
});
