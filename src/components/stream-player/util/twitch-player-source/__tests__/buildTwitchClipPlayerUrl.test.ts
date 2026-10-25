import { buildTwitchClipPlayerUrl } from '../buildTwitchClipPlayerUrl';

describe('buildTwitchClipPlayerUrl', () => {
  test('builds Twitch clip embed URLs', () => {
    expect(
      buildTwitchClipPlayerUrl({
        autoplay: true,
        clip: 'AnimatedOptimisticWasabiVoteNay',
        muted: false,
        parent: 'www.twitch.tv',
      }),
    ).toBe(
      'https://clips.twitch.tv/embed?clip=AnimatedOptimisticWasabiVoteNay&parent=www.twitch.tv&autoplay=true&muted=false&preload=metadata',
    );
  });
});
