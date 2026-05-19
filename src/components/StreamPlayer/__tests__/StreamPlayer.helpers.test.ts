import {
  buildHostedTwitchPlayerUrl,
  buildRawTwitchPlayerUrl,
  formatDuration,
  isAllowedTwitchPlayerNavigation,
  isAppUrl,
  isTwitchPassportCallbackUrl,
} from '../StreamPlayer';

describe('StreamPlayer helpers', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('allows only Twitch, parent, and hosted player navigation targets', () => {
    expect(
      isAllowedTwitchPlayerNavigation(
        'https://id.twitch.tv/oauth2/authorize',
        'www.twitch.tv',
      ),
    ).toBe(true);
    expect(
      isAllowedTwitchPlayerNavigation(
        'https://foo.example/player',
        'www.twitch.tv',
        'https://foo.example/embed/index.html',
      ),
    ).toBe(true);
    expect(
      isAllowedTwitchPlayerNavigation(
        'https://evil.example/player',
        'www.twitch.tv',
      ),
    ).toBe(false);
  });

  test('builds hosted Twitch player URLs for live channels and VODs', () => {
    const channelUrl = buildHostedTwitchPlayerUrl({
      autoplay: true,
      channel: 'cohhcarnage',
      debug: false,
      muted: true,
      playerWebsiteUrl: 'https://player.example/index.html?old=1',
    });
    const vodUrl = buildHostedTwitchPlayerUrl({
      autoplay: false,
      channel: 'cohhcarnage',
      debug: true,
      muted: false,
      playerWebsiteUrl: 'https://player.example/index.html',
      video: '123',
    });

    expect(channelUrl).toBe(
      'https://player.example/index.html?old=1&autoplay=true&muted=true&debug=false&channel=cohhcarnage',
    );
    expect(vodUrl).toBe(
      'https://player.example/index.html?autoplay=false&muted=false&debug=true&video=123',
    );
    expect(
      buildHostedTwitchPlayerUrl({
        autoplay: true,
        channel: 'cohhcarnage',
        debug: false,
        muted: true,
        playerWebsiteUrl: 'not a url',
      }),
    ).toBeNull();
  });

  test('builds raw Twitch player URLs without mixing channel and video params', () => {
    expect(
      buildRawTwitchPlayerUrl({
        autoplay: true,
        channel: 'cohhcarnage',
        muted: false,
        parent: 'www.twitch.tv',
      }),
    ).toBe(
      'https://player.twitch.tv/?autoplay=true&muted=false&parent=www.twitch.tv&channel=cohhcarnage',
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
      'https://player.twitch.tv/?autoplay=false&muted=true&parent=www.twitch.tv&video=123',
    );
  });

  test('detects app and Twitch passport callback URLs', () => {
    expect(isAppUrl('foam://stream/cohhcarnage')).toBe(true);
    expect(isAppUrl('exp+foam://stream/cohhcarnage')).toBe(true);
    expect(isAppUrl('https://www.twitch.tv')).toBe(false);

    expect(
      isTwitchPassportCallbackUrl(
        'https://www.twitch.tv/passport-callback#token=abc',
      ),
    ).toBe(true);
    expect(isTwitchPassportCallbackUrl('not a url')).toBe(false);
  });

  test('formats live durations with and without hours', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-19T16:30:00Z'));

    expect(formatDuration()).toBe('0:00');
    expect(formatDuration('2026-05-19T16:28:05Z')).toBe('1:55');
    expect(formatDuration('2026-05-19T14:28:05Z')).toBe('2:01:55');

    jest.useRealTimers();
  });
});
