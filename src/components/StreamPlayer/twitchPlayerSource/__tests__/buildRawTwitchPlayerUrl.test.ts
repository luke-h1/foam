import { buildRawTwitchPlayerUrl } from '../buildRawTwitchPlayerUrl';

describe('buildRawTwitchPlayerUrl', () => {
  test('builds raw Twitch player URLs without mixing channel and video params', () => {
    expect(
      buildRawTwitchPlayerUrl({
        autoplay: true,
        channel: 'cohhcarnage',
        muted: false,
        parent: 'www.twitch.tv',
      }),
    ).toBe(
      'https://player.twitch.tv/?channel=cohhcarnage&muted=false&parent=www.twitch.tv',
    );
    expect(
      buildRawTwitchPlayerUrl({
        autoplay: false,
        channel: 'ignored',
        muted: true,
        parent: 'www.twitch.tv',
        video: '123',
      }),
    ).toBe(
      'https://player.twitch.tv/?video=123&autoplay=false&muted=true&parent=www.twitch.tv',
    );
  });
});
