import { renderHook, act } from '@testing-library/react-native';
import { useConnectionStatePolling } from '../useConnectionStatePolling';

describe('useConnectionStatePolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns initial state from getState', () => {
    const getState = jest.fn().mockReturnValue(true);
    const { result } = renderHook(() => useConnectionStatePolling(getState));

    expect(getState).toHaveBeenCalled();
    expect(result.current).toBe(true);
  });

  test('updates when getState return value changes after interval', () => {
    let connected = false;
    const getState = jest.fn(() => connected);
    const { result } = renderHook(() =>
      useConnectionStatePolling(getState, 1000),
    );

    expect(result.current).toBe(false);

    act(() => {
      connected = true;
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getState).toHaveBeenCalled();
    expect(result.current).toBe(true);
  });

  test('polls at default 1000ms interval', () => {
    const getState = jest.fn().mockReturnValue(false);
    renderHook(() => useConnectionStatePolling(getState));

    expect(getState).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getState).toHaveBeenCalledTimes(3);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getState).toHaveBeenCalledTimes(4);
  });

  test('polls at custom interval', () => {
    const getState = jest.fn().mockReturnValue(false);
    renderHook(() => useConnectionStatePolling(getState, 500));

    expect(getState).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(getState).toHaveBeenCalledTimes(3);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(getState).toHaveBeenCalledTimes(4);
  });

  test('clears interval on unmount', () => {
    const getState = jest.fn().mockReturnValue(false);
    const { unmount } = renderHook(() =>
      useConnectionStatePolling(getState, 1000),
    );

    expect(getState).toHaveBeenCalledTimes(2);
    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(getState).toHaveBeenCalledTimes(2);
  });
});
