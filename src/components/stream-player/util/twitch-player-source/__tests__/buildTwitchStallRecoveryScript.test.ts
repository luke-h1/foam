import { buildTwitchStallRecoveryScript } from '../buildTwitchStallRecoveryScript';
import {
  type PlayerBridgeMessage,
  type PlayerScriptPage,
  resetPlayerPage,
  runPlayerScript,
  setPageBody,
} from './__fixtures__/twitchPlayerSource.fixture';

interface VideoControls {
  setCurrentTime: (seconds: number) => void;
  setEnded: (ended: boolean) => void;
  setPaused: (paused: boolean) => void;
}

function installVideo(initial: {
  currentTime?: number;
  paused?: boolean;
}): VideoControls {
  setPageBody('<video></video>');

  const video = document.querySelector('video');

  if (!video) {
    throw new Error('video element is missing');
  }

  let currentTime = initial.currentTime ?? 0;
  let paused = initial.paused ?? false;
  let ended = false;

  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    get: () => currentTime,
    set: next => {
      currentTime = next;
    },
  });

  Object.defineProperty(video, 'paused', {
    configurable: true,
    get: () => paused,
  });

  Object.defineProperty(video, 'ended', {
    configurable: true,
    get: () => ended,
  });

  // jsdom has no media stack; a resolved play() keeps the soft nudge quiet.
  video.play = () => Promise.resolve();

  return {
    setCurrentTime: next => {
      currentTime = next;
    },
    setEnded: next => {
      ended = next;
    },
    setPaused: next => {
      paused = next;
    },
  };
}

function run(live: boolean): PlayerScriptPage {
  const page = runPlayerScript(buildTwitchStallRecoveryScript({ live }));

  page.window.__foamSyncToLive = jest.fn();
  page.window.__foamEnsurePlaying = jest.fn();

  return page;
}

/**
 * Advance the playhead on the next poll so the watchdog records one real
 * forward move, which is what arms recovery.
 */
function startPlayback(video: VideoControls) {
  jest.advanceTimersByTime(2000);
  video.setCurrentTime(2);
  jest.advanceTimersByTime(2000);
}

describe('buildTwitchStallRecoveryScript', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetPlayerPage();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('nudges playback after a short freeze', () => {
    const video = installVideo({ currentTime: 1 });
    const page = run(true);

    startPlayback(video);

    // Freeze the playhead and cross the 6s soft threshold.
    jest.advanceTimersByTime(6000);

    expect(page.window.__foamEnsurePlaying).toHaveBeenCalled();

    expect(page.window.__foamSyncToLive).toHaveBeenCalled();

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([
      {
        type: 'trace',
        payload: { step: 'stall', detail: 'soft recover after 6s' },
      },
    ]);
  });

  test('asks native to remount after a long freeze', () => {
    const video = installVideo({ currentTime: 1 });
    const page = run(true);

    startPlayback(video);

    // Hold the freeze past the 14s hard threshold.
    jest.advanceTimersByTime(14_000);

    const stalled = page.messages.filter(message => message.type === 'stalled');

    expect(stalled).toEqual<PlayerBridgeMessage[]>([
      { type: 'stalled', payload: { frozenMs: 14_000 } },
    ]);
  });

  test('does nothing while the video is paused', () => {
    installVideo({ currentTime: 1, paused: true });
    const page = run(true);

    jest.advanceTimersByTime(30_000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([]);
  });

  test('does not recover a playhead that never advanced', () => {
    installVideo({ currentTime: 0 });
    const page = run(true);

    // Playing but stuck before the first frame: initial buffering, not a stall.
    jest.advanceTimersByTime(30_000);

    expect(page.messages.some(message => message.type === 'stalled')).toBe(
      false,
    );
  });

  test('a steadily advancing playhead never triggers recovery', () => {
    const video = installVideo({ currentTime: 0 });
    const page = run(true);

    for (let second = 1; second <= 15; second += 1) {
      video.setCurrentTime(second);
      jest.advanceTimersByTime(2000);
    }

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([]);
  });
});
