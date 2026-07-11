import { buildTwitchAutoplayEnsureScript } from '../buildTwitchAutoplayEnsureScript';

describe('buildTwitchAutoplayEnsureScript', () => {
  test('autoplay-ensure starts muted then raises the volume', () => {
    const script = buildTwitchAutoplayEnsureScript({ muted: false });

    expect(script).toContain('var TARGET_MUTED = false');
    expect(script).toContain('var START_DELAY_MS = 800');
    // Playback always begins muted (the only state iOS autoplay reliably
    // permits) so the picture moves immediately.
    expect(script).toContain('video.muted = true');
    expect(script).toContain('video.play()');
    // Once playing, reconcileAudio brings the stream up to full volume.
    expect(script).toContain('video.muted = false');
    expect(script).toContain('video.volume = 1');
  });

  test('autoplay-ensure gives up to muted after repeated unmute re-pauses', () => {
    const script = buildTwitchAutoplayEnsureScript({ muted: false });

    // Unmuting an ongoing stream can make iOS silently re-pause it; the script
    // resumes and retries a bounded number of times, then accepts muted
    // playback so the picture never stalls on a pause.
    expect(script).toContain('var unmuteBlocked = false');
    expect(script).toContain('unmuteAttempts++');
    expect(script).toContain('if (unmuteAttempts >= 3)');
    expect(script).toContain('unmuteBlocked = true;');
    expect(script).toContain('playMuted(v);');
    // Nested unmute retries re-query the video; bail if it was torn down
    // mid-timeout (channel switch / ad swap) so we do not throw on null.
    expect(script).toContain('if (!video) { return; }');
  });

  test('autoplay-ensure keeps a muted start muted', () => {
    const script = buildTwitchAutoplayEnsureScript({
      muted: true,
      startDelayMs: 0,
    });

    expect(script).toContain('var TARGET_MUTED = true');
    expect(script).toContain('var START_DELAY_MS = 0');
    // With a muted target the stream is held muted, never raised to volume.
    expect(script).toContain('if (!video.muted) { video.muted = true; }');
  });
});
