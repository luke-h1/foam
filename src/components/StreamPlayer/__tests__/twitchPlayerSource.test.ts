
import {
  buildRawTwitchPlayerBootstrapScript,
  buildRawTwitchPlayerUrl,
  buildTwitchClipPlayerUrl,
  isAllowedTwitchPlayerNavigation,
  isAppUrl,
  isTwitchPassportCallbackUrl,
} from '../twitchPlayerSource';

describe('twitchPlayerSource', () => {

  test('allows only Twitch and parent navigation targets', () => {
    expect(isAllowedTwitchPlayerNavigation('', 'www.twitch.tv')).toBe(false);
    expect(
      isAllowedTwitchPlayerNavigation(
        'https://id.twitch.tv/oauth2/authorize',
        'www.twitch.tv',
      ),
    ).toBe(true);
    expect(
      isAllowedTwitchPlayerNavigation(
        'https://evil.example/player',
        'www.twitch.tv',
      ),
    ).toBe(false);
    expect(
      isAllowedTwitchPlayerNavigation(
        'https://www.twitch.tv/login',
        'www.twitch.tv',
      ),
    ).toBe(true);
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

  test('starts raw Twitch autoplay in the requested audio state and recovers after layout changes', () => {
    const script = buildRawTwitchPlayerBootstrapScript({
      autoplay: true,
      debug: false,
      muted: false,
    });

    expect(script).toContain('var targetMuted = false');
    expect(script).toContain('var userPaused = !shouldAutoplay');
    expect(script).toContain('video.muted = targetMuted');
    expect(script).toContain("video.addEventListener('playing', function()");
    expect(script).toContain(
      "window.addEventListener('orientationchange', schedulePlaybackRecovery)",
    );
  });

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
});
