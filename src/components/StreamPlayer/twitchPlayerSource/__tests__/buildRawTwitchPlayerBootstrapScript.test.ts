import { buildRawTwitchPlayerBootstrapScript } from '../buildRawTwitchPlayerBootstrapScript';

describe('buildRawTwitchPlayerBootstrapScript', () => {
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

  test('playback watchdog treats an active ad break like a pause', () => {
    const script = buildRawTwitchPlayerBootstrapScript({
      autoplay: true,
      debug: false,
      muted: false,
    });

    expect(script).toContain('function isAdActive()');
    expect(script).toContain('[data-a-target="video-ad-label"]');
    expect(script).toContain(
      '!video || video.paused || userPaused || !startAllowed || isAdActive()',
    );
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
});
