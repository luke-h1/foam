import type { MessageToken } from '../message-token';
import { getMessageTokenText } from '../message-token-content';

describe('getMessageTokenText', () => {
  test('returns the content of a text token', () => {
    const token = {
      type: 'text',
      content: 'hello world',
    } satisfies MessageToken<'text'>;

    expect(getMessageTokenText(token)).toBe('hello world');
  });

  test('returns the content of a mention token', () => {
    const token = {
      type: 'mention',
      content: '@someone',
    } satisfies MessageToken<'mention'>;

    expect(getMessageTokenText(token)).toBe('@someone');
  });

  test('returns the original cheer token from a cheermote token', () => {
    const token = {
      type: 'cheermote',
      content: 'Cheer100',
      cheermote: {
        bits: 100,
        color: '#9c3ee8',
        prefix: 'Cheer',
        static_url: 'https://example.com/static.png',
        url: 'https://example.com/animated.gif',
      },
    } satisfies MessageToken<'cheermote'>;

    expect(getMessageTokenText(token)).toBe('Cheer100');
  });

  test('returns an empty string for a token that has no content field', () => {
    const token = {
      type: 'ritual',
      displayName: 'NewViewer',
      ritualName: 'new_chatter',
      systemMsg: 'NewViewer is new here!',
    } satisfies MessageToken<'ritual'>;

    expect(getMessageTokenText(token)).toBe('');
  });

  test('returns an empty string when the content is an empty string', () => {
    const token = { type: 'text', content: '' } satisfies MessageToken<'text'>;

    expect(getMessageTokenText(token)).toBe('');
  });
});
