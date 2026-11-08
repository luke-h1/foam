import type { RefObject } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { StreamPlayerRef } from '@app/components/stream-player/types';

import { useReleaseAndGoBack } from '../hooks/use-release-and-go-back';

const canGoBack = jest.fn(() => true);

Object.assign(router, { canGoBack });

function createPlayerRef(): RefObject<Pick<
  StreamPlayerRef,
  'releaseMedia'
> | null> {
  return { current: { releaseMedia: jest.fn() } };
}

describe('useReleaseAndGoBack', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('releases the media, then goes back after the pause', () => {
    const playerRef = createPlayerRef();
    const { result } = renderHook(() => useReleaseAndGoBack(playerRef));

    act(() => result.current());

    expect(playerRef.current?.releaseMedia).toHaveBeenCalledTimes(1);

    expect(router.back).not.toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  test('goes back once when the sleep timer and the back button both fire', () => {
    const { result } = renderHook(() => useReleaseAndGoBack(createPlayerRef()));

    act(() => {
      result.current();
      result.current();
      jest.runAllTimers();
    });

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  test('does not go back after the screen unmounts', () => {
    const { result, unmount } = renderHook(() =>
      useReleaseAndGoBack(createPlayerRef()),
    );

    act(() => result.current());
    unmount();

    act(() => {
      jest.runAllTimers();
    });

    expect(router.back).not.toHaveBeenCalled();
  });
});
