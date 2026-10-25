import { buildTwitchAutoplayEnsureScript } from '../build-twitch-autoplay-ensure-script';
import {
  type PlayerBridgeMessage,
  resetPlayerPage,
  runPlayerScript,
} from './__fixtures__/twitch-player-source.fixture';

interface PlayerVideo {
  element: HTMLVideoElement;
  isPlaying: () => boolean;
}

function addVideo({ blocksUnmutedPlay = false } = {}): PlayerVideo {
  const element = document.createElement('video');

  let paused = true;
  let muted = false;
  let volume = 0.5;

  Object.defineProperties(element, {
    paused: { get: () => paused },
    muted: {
      get: () => muted,
      set: (next: boolean) => {
        muted = next;

        if (!next && blocksUnmutedPlay) {
          paused = true;
        }
      },
    },
    volume: {
      get: () => volume,
      set: (next: number) => {
        volume = next;
      },
    },
  });

  element.play = () => {
    if (muted || !blocksUnmutedPlay) {
      paused = false;
      element.dispatchEvent(new Event('playing'));
    }

    return Promise.resolve();
  };

  document.body.append(element);

  return { element, isPlaying: () => !paused };
}

describe('buildTwitchAutoplayEnsureScript', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetPlayerPage();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('starts playback muted after the start delay, then unmutes at full volume', () => {
    const video = addVideo();

    const page = runPlayerScript(
      buildTwitchAutoplayEnsureScript({ muted: false, startDelayMs: 800 }),
    );

    jest.advanceTimersByTime(799);

    expect(video.isPlaying()).toBe(false);

    jest.advanceTimersByTime(1);

    expect(video.isPlaying()).toBe(true);

    jest.advanceTimersByTime(1000);

    expect(video.isPlaying()).toBe(true);

    expect(video.element.muted).toBe(false);

    expect(video.element.volume).toBe(1);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([
      { type: 'muteState', payload: { muted: false, volume: 0.5 } },
    ]);
  });

  test('keeps a muted start muted', () => {
    const video = addVideo();

    runPlayerScript(
      buildTwitchAutoplayEnsureScript({ muted: true, startDelayMs: 0 }),
    );

    jest.advanceTimersByTime(2000);

    expect(video.isPlaying()).toBe(true);

    expect(video.element.muted).toBe(true);
  });

  test('falls back to muted playback when unmuting keeps pausing the video', () => {
    const video = addVideo({ blocksUnmutedPlay: true });

    runPlayerScript(
      buildTwitchAutoplayEnsureScript({ muted: false, startDelayMs: 0 }),
    );

    jest.advanceTimersByTime(500);

    expect(video.isPlaying()).toBe(false);

    jest.advanceTimersByTime(5000);

    expect(video.isPlaying()).toBe(true);

    expect(video.element.muted).toBe(true);
  });

  test('applies a user unmute and reports the new mute state', () => {
    const video = addVideo();

    const page = runPlayerScript(
      buildTwitchAutoplayEnsureScript({ muted: true, startDelayMs: 0 }),
    );

    jest.advanceTimersByTime(1000);
    page.window.__foamSetMuted?.(false);

    expect(video.element.muted).toBe(false);

    expect(video.element.volume).toBe(1);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([
      { type: 'muteState', payload: { muted: false, volume: 0.5 } },
      { type: 'muteState', payload: { muted: false, volume: 1 } },
    ]);
  });
});
