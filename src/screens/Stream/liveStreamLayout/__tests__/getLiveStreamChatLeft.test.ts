import { getLiveStreamChatLeft } from '../getLiveStreamChatLeft';

describe('getLiveStreamChatLeft', () => {
  test('positions landscape chat against the right edge', () => {
    expect(
      getLiveStreamChatLeft({
        chatWidth: 320,
        isLandscape: true,
        screenWidth: 932,
      }),
    ).toBe(612);
  });

  test('keeps portrait chat aligned to the left edge', () => {
    expect(
      getLiveStreamChatLeft({
        chatWidth: 430,
        isLandscape: false,
        screenWidth: 430,
      }),
    ).toBe(0);
  });
});
