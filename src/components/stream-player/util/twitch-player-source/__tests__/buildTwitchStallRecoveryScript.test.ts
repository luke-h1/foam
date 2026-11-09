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

  test('does nothing once the video has ended', () => {
    const video = installVideo({ currentTime: 1 });
    const page = run(true);

    startPlayback(video);
    video.setEnded(true);

    // Freeze the playhead well past the hard threshold: an ended video is not
    // a stall.
    jest.advanceTimersByTime(30_000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([]);
  });

  test('does nothing during an ad break', () => {
    const video = installVideo({ currentTime: 1 });
    const page = run(true);

    startPlayback(video);

    // The ad plays on its own element and advances the real playhead later.
    // A frozen main playhead during the ad must not remount the player.
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div data-a-target="video-ad-label"></div>',
    );

    jest.advanceTimersByTime(30_000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([]);
  });

  test('a soft nudge seek is not read as progress, so a wedged stream still remounts', () => {
    const video = installVideo({ currentTime: 1 });
    const page = run(true);

    // The live sync seeks the playhead forward on each nudge, as it does on
    // device, while the picture stays frozen. If that seek passed as real
    // progress it would reset the timer and the hard remount would never fire.
    let liveEdge = 2;
    page.window.__foamSyncToLive = jest.fn(() => {
      liveEdge += 30;
      video.setCurrentTime(liveEdge);

      return true;
    });

    startPlayback(video);

    jest.advanceTimersByTime(20_000);

    expect(page.messages.some(message => message.type === 'stalled')).toBe(
      true,
    );
  });

  test('a seek that recovers after a long freeze does not post a spurious stall', () => {
    const video = installVideo({ currentTime: 1 });
    const page = run(true);

    // Each nudge seeks the playhead forward, as it does on device.
    let liveEdge = 2;
    const sync = jest.fn(() => {
      liveEdge += 30;
      video.setCurrentTime(liveEdge);

      return true;
    });
    page.window.__foamSyncToLive = jest.fn(sync);

    startPlayback(video);

    // Hold the freeze to just before the hard threshold, through two nudges.
    jest.advanceTimersByTime(12_000);

    // The last seek takes and playback keeps advancing on its own: a recovery.
    // The swallowed seek jump must not fall through to a remount.
    for (let offset = 1; offset <= 6; offset += 1) {
      video.setCurrentTime(liveEdge + offset);
      jest.advanceTimersByTime(2000);
    }

    expect(page.messages.some(message => message.type === 'stalled')).toBe(
      false,
    );
  });

  test('a nudge that does not seek leaves a genuine resume to clear the freeze', () => {
    const video = installVideo({ currentTime: 1 });
    const page = run(true);

    // The sync finds nothing to seek (drift under target) and returns false, so
    // the real advance that follows must count as progress, not a seek.
    page.window.__foamSyncToLive = jest.fn(() => false);

    startPlayback(video);

    // Freeze long enough for a soft nudge to fire and return false.
    jest.advanceTimersByTime(10_000);

    // The stream resumes on its own with a real advance.
    video.setCurrentTime(3);
    jest.advanceTimersByTime(2000);

    // A short freeze that could not stall from a reset baseline.
    jest.advanceTimersByTime(6000);

    expect(page.messages.some(message => message.type === 'stalled')).toBe(
      false,
    );
  });

  test('a suspended timer gap does not read as a stall', () => {
    const video = installVideo({ currentTime: 1 });
    const page = run(true);

    startPlayback(video);

    // The timer stops firing while the app is backgrounded, then one tick lands
    // after a long wall-clock jump. That single gap is not a freeze, so the
    // watchdog resets its baseline instead of posting stalled.
    jest.setSystemTime(Date.now() + 60_000);
    jest.advanceTimersByTime(2000);

    expect(page.messages.some(message => message.type === 'stalled')).toBe(
      false,
    );
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
