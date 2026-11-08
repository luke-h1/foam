import { renderHook } from '@testing-library/react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';

import type { StreamPlayerRef } from '@app/components/stream-player/types';

import { useStreamPlayerScreenLifecycle } from '../hooks/use-stream-player-screen-lifecycle';

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-screen-orientation', () => ({
  OrientationLock: { PORTRAIT_UP: 'PORTRAIT_UP' },
  lockAsync: jest.fn(() => Promise.resolve()),
  unlockAsync: jest.fn(() => Promise.resolve()),
}));

function createPlayer() {
  return {
    forceRefresh: jest.fn(),
    getChannel: jest.fn(),
    getCurrentTime: jest.fn(() => Promise.resolve(0)),
    getDuration: jest.fn(() => Promise.resolve(0)),
    getMuted: jest.fn(() => false),
    getPaused: jest.fn(() => false),
    getVolume: jest.fn(() => 1),
    isPictureInPicture: jest.fn(() => false),
    mute: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    releaseMedia: jest.fn(),
    seek: jest.fn(),
    setChannel: jest.fn(),
    setMuted: jest.fn(),
    setQuality: jest.fn(),
    setVideo: jest.fn(),
    setVolume: jest.fn(),
    syncToLive: jest.fn(),
    togglePictureInPicture: jest.fn(),
    unmute: jest.fn(),
  } satisfies StreamPlayerRef;
}

describe('useStreamPlayerScreenLifecycle', () => {
  test('unlocks rotation and keeps the screen awake while focused, then pauses and locks portrait on blur', () => {
    const player = createPlayer();
    const onBlur = jest.fn();

    const { unmount } = renderHook(() =>
      useStreamPlayerScreenLifecycle({
        keepAwakeTag: 'vod-player',
        onBlur,
        streamPlayerRef: { current: player },
      }),
    );

    expect(ScreenOrientation.unlockAsync).toHaveBeenCalledTimes(1);

    expect(jest.mocked(activateKeepAwakeAsync).mock.calls).toEqual([
      ['vod-player'],
    ]);

    unmount();

    expect(player.pause).toHaveBeenCalledTimes(1);

    expect(jest.mocked(ScreenOrientation.lockAsync).mock.calls).toEqual([
      ['PORTRAIT_UP'],
    ]);

    expect(jest.mocked(deactivateKeepAwake).mock.calls).toEqual([
      ['vod-player'],
    ]);

    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
