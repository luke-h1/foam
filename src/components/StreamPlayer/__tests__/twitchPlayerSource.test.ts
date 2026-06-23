import {
  buildRawTwitchPlayerBootstrapScript,
  buildRawTwitchPlayerUrl,
  buildTwitchAutoplayEnsureScript,
  buildTwitchCaptionHiderScript,
  buildTwitchClipPlayerUrl,
  buildTwitchContentGateAcceptScript,
  buildTwitchOverlayHideScript,
  buildTwitchPlayerAudioDefaultScript,
  isAppUrl,
  isTwitchPassportCallbackUrl,
} from '../twitchPlayerSource';

describe('twitchPlayerSource', () => {
  test('content-gate accept clicks the anonymous classification gate', () => {
    const script = buildTwitchContentGateAcceptScript();

    expect(script).toContain(
      'asyncQuerySelector(\'button[data-a-target*="content-classification-gate"]\', 10000)',
    );
    expect(script).toContain('button.click()');
  });

  test('overlay hide targets only the three player-chrome selectors', () => {
    const script = buildTwitchOverlayHideScript();

    expect(script).toContain("document.querySelector('.top-bar')");
    expect(script).toContain("document.querySelector('.player-controls')");
    expect(script).toContain(
      "document.querySelector('#channel-player-disclosures')",
    );
    expect(script).toContain(
      "document.querySelector('.video-player__overlay')",
    );
    // Must not reintroduce subscribe/gift/follow blocking or click interception.
    expect(script).not.toContain('subscribe-button');
    expect(script).not.toContain("addEventListener('click'");
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

  test('autoplay-ensure unmutes and plays the video after a startup defer', () => {
    const script = buildTwitchAutoplayEnsureScript({ muted: false });

    expect(script).toContain('var TARGET_MUTED = false');
    expect(script).toContain('var START_DELAY_MS = 800');
    expect(script).toContain('video.muted = TARGET_MUTED');
    expect(script).toContain('video.volume = 1');
    expect(script).toContain('video.play()');
    // Falls back to muted playback only if unmuted autoplay is blocked.
    expect(script).toContain('video.muted = true');
  });

  test('autoplay-ensure recovers when an unmuted play() silently re-pauses', () => {
    const script = buildTwitchAutoplayEnsureScript({ muted: false });

    // iOS resolves an unmuted play() then re-pauses with no rejection to
    // catch, so a deferred check falls back to muted playback if still paused.
    expect(script).toContain('if (video.paused) { playMuted(video); }');
    // Once unmuting re-pauses the video, stop fighting it (no oscillation).
    expect(script).toContain('var unmuteBlocked = false');
    expect(script).toContain('unmuteBlocked = true; playMuted(video);');
  });

  test('autoplay-ensure keeps a muted start muted', () => {
    const script = buildTwitchAutoplayEnsureScript({
      muted: true,
      startDelayMs: 0,
    });

    expect(script).toContain('var TARGET_MUTED = true');
    expect(script).toContain('var START_DELAY_MS = 0');
    // Volume is raised only when not muted (guarded at runtime).
    expect(script).toContain('if (!TARGET_MUTED) { video.volume = 1; }');
  });

  test('seeds the Twitch player mute preference so it boots in the requested audio state', () => {
    const unmuted = buildTwitchPlayerAudioDefaultScript({ muted: false });
    expect(unmuted).toContain(
      "window.localStorage.setItem(\n      'video-muted',\n      JSON.stringify({ default: false })\n    )",
    );
    expect(unmuted).toContain("window.localStorage.setItem('volume', '1')");

    const muted = buildTwitchPlayerAudioDefaultScript({ muted: true });
    expect(muted).toContain('JSON.stringify({ default: true })');
    expect(muted).toContain("window.localStorage.setItem('volume', '1')");
  });

  test('hides captions with text track "hidden", never "disabled"', () => {
    const script = buildRawTwitchPlayerBootstrapScript({
      autoplay: true,
      debug: false,
      muted: false,
    });

    // 'disabled' makes WKWebView's native HLS AVPlayer renegotiate and stall;
    // 'hidden' keeps the track loaded but unrendered. No caption CSS either.
    expect(script).toContain("video.textTracks[0].mode = 'hidden'");
    expect(script).not.toContain("mode = 'disabled'");
    expect(script).not.toContain('text-track-container');
  });

  test('caption hider switches the text track to hidden on play and pause', () => {
    const script = buildTwitchCaptionHiderScript();

    expect(script).toContain("video.textTracks[0].mode = 'hidden'");
    expect(script).not.toContain("mode = 'disabled'");
    expect(script).not.toContain('text-track-container');
    expect(script).toContain("video.addEventListener('playing'");
    expect(script).toContain("video.addEventListener('pause'");
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
