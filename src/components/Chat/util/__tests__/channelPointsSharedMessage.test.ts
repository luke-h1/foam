import { hasSharedChannelPointsMessage } from '../channelPointsSharedMessage';

describe('hasSharedChannelPointsMessage', () => {
  test('returns false for empty message parts', () => {
    expect(hasSharedChannelPointsMessage([])).toBe(false);
  });

  test('returns false for whitespace-only text', () => {
    expect(
      hasSharedChannelPointsMessage([{ type: 'text', content: '   \n' }]),
    ).toBe(false);
  });

  test('returns true for non-empty text', () => {
    expect(
      hasSharedChannelPointsMessage([{ type: 'text', content: '你好' }]),
    ).toBe(true);
  });

  test('returns true for emote-only shared messages', () => {
    expect(
      hasSharedChannelPointsMessage([
        {
          type: 'emote',
          content: 'Cat',
          original_name: 'Cat',
          name: 'Cat',
          id: '1',
          url: 'https://example.com/cat.png',
          site: 'Twitch Global',
        },
      ]),
    ).toBe(true);
  });
});
