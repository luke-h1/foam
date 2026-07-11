import { buildTwitchLiveSyncScript } from '../buildTwitchLiveSyncScript';

describe('buildTwitchLiveSyncScript', () => {
  test('live sync seeks to the live edge and exposes a re-trigger hook', () => {
    const script = buildTwitchLiveSyncScript({ targetSeconds: 3 });

    // Measures client drift from the newest seekable segment.
    expect(script).toContain('seekable.end(seekable.length - 1)');
    expect(script).toContain('var drift = liveEdge - video.currentTime');
    expect(script).toContain('var TARGET_S = 3');
    // Seeks to the live edge, leaving the target buffer.
    expect(script).toContain('video.currentTime = liveEdge - TARGET_S');
    // Re-triggerable on demand from chat settings.
    expect(script).toContain('window.__foamSyncToLive = function()');
    // Runs once at start, not on a continuous interval.
    expect(script).not.toContain('setInterval');
    // Skips ads so the start-sync targets the real stream, not a pre-roll.
    expect(script).toContain('function isAdActive()');
    expect(script).toContain('skipped (ad playing)');
  });
});
