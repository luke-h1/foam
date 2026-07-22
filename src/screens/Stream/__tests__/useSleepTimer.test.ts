import { act, renderHook } from '@testing-library/react-native';

import { useSleepTimer } from '../hooks/useSleepTimer';

describe('useSleepTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fires onExpire once after the selected duration', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(() => useSleepTimer({ onExpire }));

    act(() => {
      result.current.start(15);
    });
    expect(result.current.isActive).toEqual(true);

    act(() => {
      jest.advanceTimersByTime(14 * 60_000);
    });
    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.isActive).toEqual(false);
  });

  test('cancel stops the countdown without firing', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(() => useSleepTimer({ onExpire }));

    act(() => {
      result.current.start(15);
    });
    act(() => {
      result.current.cancel();
    });
    act(() => {
      jest.advanceTimersByTime(60 * 60_000);
    });

    expect(onExpire).not.toHaveBeenCalled();
    expect(result.current.isActive).toEqual(false);
  });

  test('restarting replaces the previous deadline', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(() => useSleepTimer({ onExpire }));

    act(() => {
      result.current.start(15);
    });
    act(() => {
      result.current.start(30);
    });

    act(() => {
      jest.advanceTimersByTime(15 * 60_000);
    });
    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(15 * 60_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  test('getRemainingMinutes rounds up to the next whole minute', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(() => useSleepTimer({ onExpire }));

    expect(result.current.getRemainingMinutes()).toEqual(0);

    act(() => {
      result.current.start(30);
    });
    act(() => {
      jest.advanceTimersByTime(5 * 60_000 + 30_000);
    });

    expect(result.current.getRemainingMinutes()).toEqual(25);
  });

  test('unmount clears the pending timeout', () => {
    const onExpire = jest.fn();
    const { result, unmount } = renderHook(() => useSleepTimer({ onExpire }));

    act(() => {
      result.current.start(15);
    });
    unmount();
    act(() => {
      jest.advanceTimersByTime(60 * 60_000);
    });

    expect(onExpire).not.toHaveBeenCalled();
  });
});
