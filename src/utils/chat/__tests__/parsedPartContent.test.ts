import type { ParsedPart } from '../parsedPart';
import { getParsedPartStringContent } from '../parsedPartContent';

describe('getParsedPartStringContent', () => {
  test('returns the content of a text part', () => {
    const part = {
      type: 'text',
      content: 'hello world',
    } satisfies ParsedPart<'text'>;

    expect(getParsedPartStringContent(part)).toBe('hello world');
  });

  test('returns the content of a mention part', () => {
    const part = {
      type: 'mention',
      content: '@someone',
    } satisfies ParsedPart<'mention'>;

    expect(getParsedPartStringContent(part)).toBe('@someone');
  });

  test('returns the original cheer token from a cheermote part', () => {
    const part = {
      type: 'cheermote',
      content: 'Cheer100',
      cheermote: {
        bits: 100,
        color: '#9c3ee8',
        prefix: 'Cheer',
        static_url: 'https://example.com/static.png',
        url: 'https://example.com/animated.gif',
      },
    } satisfies ParsedPart<'cheermote'>;

    expect(getParsedPartStringContent(part)).toBe('Cheer100');
  });

  test('returns an empty string for a part that has no content field', () => {
    const part = {
      type: 'ritual',
      displayName: 'NewViewer',
      ritualName: 'new_chatter',
      systemMsg: 'NewViewer is new here!',
    } satisfies ParsedPart<'ritual'>;

    expect(getParsedPartStringContent(part)).toBe('');
  });

  test('returns an empty string when the content is an empty string', () => {
    const part = { type: 'text', content: '' } satisfies ParsedPart<'text'>;

    expect(getParsedPartStringContent(part)).toBe('');
  });
});
