import type { RefObject } from 'react';

import { act, renderHook } from '@testing-library/react-native';

import { useScrollRef, useScrollToTop } from '../useScrollToTop';

const mockUseNavigationScrollToTop = jest.fn();

jest.mock('expo-router', () => ({
  useScrollToTop: (ref: RefObject<{ scrollToTop: () => void } | null>) =>
    mockUseNavigationScrollToTop(ref),
}));

describe('useScrollToTop', () => {
  const getRegisteredRef = (): RefObject<{ scrollToTop: () => void } | null> =>
    mockUseNavigationScrollToTop.mock.calls.at(-1)?.[0];

  beforeEach(() => {
    mockUseNavigationScrollToTop.mockClear();
  });

  test('registers a native scrollToTop target', () => {
    const scrollToTop = jest.fn();
    const ref = { current: { scrollToTop } };

    renderHook(() => useScrollToTop(ref));

    act(() => {
      getRegisteredRef().current?.scrollToTop();
    });

    expect(scrollToTop).toHaveBeenCalledTimes(1);
  });

  test('scrolls standard scroll views to the configured offset', () => {
    const scrollTo = jest.fn();
    const ref = { current: { scrollTo } };

    renderHook(() => useScrollToTop(ref, 72));

    act(() => {
      getRegisteredRef().current?.scrollToTop();
    });

    expect(scrollTo).toHaveBeenCalledWith({ y: 72, animated: true });
  });

  test('scrolls virtualized lists to the configured offset', () => {
    const scrollToOffset = jest.fn();
    const ref = { current: { scrollToOffset } };

    renderHook(() => useScrollToTop(ref, 48));

    act(() => {
      getRegisteredRef().current?.scrollToTop();
    });

    expect(scrollToOffset).toHaveBeenCalledWith({
      offset: 48,
      animated: true,
    });
  });

  test('scrolls legacy responder wrappers', () => {
    const scrollResponderScrollTo = jest.fn();
    const ref = {
      current: {
        getScrollResponder: () => ({ scrollResponderScrollTo }),
      },
    };

    renderHook(() => useScrollToTop(ref, 24));

    act(() => {
      getRegisteredRef().current?.scrollToTop();
    });

    expect(scrollResponderScrollTo).toHaveBeenCalledWith({
      y: 24,
      animated: true,
    });
  });

  test('scrolls node wrappers', () => {
    const scrollTo = jest.fn();
    const ref = {
      current: {
        getNode: () => ({ scrollTo }),
      },
    };

    renderHook(() => useScrollToTop(ref, 12));

    act(() => {
      getRegisteredRef().current?.scrollToTop();
    });

    expect(scrollTo).toHaveBeenCalledWith({ y: 12, animated: true });
  });

  test('scrolls web views with injected JavaScript', () => {
    const injectJavaScript = jest.fn();
    const ref = { current: { injectJavaScript } };

    renderHook(() => useScrollToTop(ref, 36));

    act(() => {
      getRegisteredRef().current?.scrollToTop();
    });

    expect(injectJavaScript).toHaveBeenCalledWith(
      ";window.scrollTo({ top: 36, behavior: 'smooth' }); true;",
    );
  });

  test('ignores callback refs and empty refs', () => {
    renderHook(() => useScrollToTop(jest.fn()));
    expect(getRegisteredRef().current).toBeNull();

    renderHook(() => useScrollToTop({ current: null }));
    expect(getRegisteredRef().current).toBeNull();
  });

  test('creates a native scroll ref helper', () => {
    const { result } = renderHook(() => useScrollRef());

    expect(result.current).toEqual({ current: null });
    expect(mockUseNavigationScrollToTop).toHaveBeenCalled();
  });
});
