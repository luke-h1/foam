import { createContext, runInContext } from 'node:vm';

import { buildTwitchLiveSyncScript } from '../buildTwitchLiveSyncScript';

interface FakeTimeRanges {
  length: number;
  end: (index: number) => number;
}

interface FakeVideo {
  buffered: FakeTimeRanges;
  currentTime: number;
  seekable: FakeTimeRanges;
}

function timeRanges(...ends: number[]): FakeTimeRanges {
  return { length: ends.length, end: index => ends[index] ?? NaN };
}

function makeVideo(video: Partial<FakeVideo>): FakeVideo {
  return {
    buffered: timeRanges(),
    currentTime: 0,
    seekable: timeRanges(),
    ...video,
  };
}

/**
 * Runs the built script against a stub page so the seek target is asserted as
 * behaviour rather than as source text.
 */
function installLiveSync(video: FakeVideo): () => boolean {
  const window: {
    ReactNativeWebView: { postMessage: () => void };
    __foamSyncToLive?: () => boolean;
  } = {
    ReactNativeWebView: { postMessage: () => undefined },
  };
  const document = {
    querySelector: (selector: string) => (selector === 'video' ? video : null),
  };

  runInContext(
    buildTwitchLiveSyncScript({}),
    createContext({ document, setTimeout: () => 0, window }),
  );

  const syncToLive = window.__foamSyncToLive;
  if (!syncToLive) {
    throw new Error('live sync script did not install __foamSyncToLive');
  }
  return syncToLive;
}

describe('buildTwitchLiveSyncScript', () => {
  test('live sync exposes a re-trigger hook and runs once rather than on an interval', () => {
    const script = buildTwitchLiveSyncScript({ targetSeconds: 3 });

    expect(script).toContain('var TARGET_S = 3');
    // Re-triggerable on demand from chat settings.
    expect(script).toContain('window.__foamSyncToLive = function()');
    // Runs once at start, not on a continuous interval.
    expect(script).not.toContain('setInterval');
    // Skips ads so the start-sync targets the real stream, not a pre-roll.
    expect(script).toContain('function isAdActive()');
    expect(script).toContain('skipped (ad playing)');
  });

  test('seeks to the live edge less the latency target', () => {
    const video = makeVideo({
      buffered: timeRanges(100),
      currentTime: 40,
      seekable: timeRanges(100),
    });

    expect(installLiveSync(video)()).toBe(true);
    expect(video.currentTime).toBe(97);
  });

  test('caps the live edge at the buffered end, so an MSE sentinel cannot strand the video', () => {
    const video = makeVideo({
      // Android's MSE embed ends a live seekable range at 2^30.
      seekable: timeRanges(1_073_741_824),
      buffered: timeRanges(42),
      currentTime: 10,
    });

    expect(installLiveSync(video)()).toBe(true);
    expect(video.currentTime).toBe(39);
  });

  test('does not seek when only the sentinel seekable range is known', () => {
    const video = makeVideo({
      seekable: timeRanges(1_073_741_824),
      currentTime: 10,
    });

    expect(installLiveSync(video)()).toBe(false);
    expect(video.currentTime).toBe(10);
  });

  test('does not seek when already inside the latency target', () => {
    const video = makeVideo({
      buffered: timeRanges(100),
      currentTime: 98,
      seekable: timeRanges(100),
    });

    expect(installLiveSync(video)()).toBe(false);
    expect(video.currentTime).toBe(98);
  });

  test('does not seek backwards when the buffered end trails the playhead', () => {
    const video = makeVideo({
      buffered: timeRanges(50),
      currentTime: 80,
      seekable: timeRanges(1_073_741_824),
    });

    expect(installLiveSync(video)()).toBe(false);
    expect(video.currentTime).toBe(80);
  });

  test('does not seek with nothing buffered or seekable', () => {
    const video = makeVideo({ currentTime: 12 });

    expect(installLiveSync(video)()).toBe(false);
    expect(video.currentTime).toBe(12);
  });
});
