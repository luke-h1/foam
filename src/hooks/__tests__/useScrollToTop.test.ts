import type { RefObject } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import * as ExpoRouter from 'expo-router';

import { useScrollRef, useScrollToTop } from '../useScrollToTop';

const mockUseNavigationScrollToTop = jest
  .spyOn(ExpoRouter, 'useScrollToTop')
  .mockImplementation(() => undefined);

describe('useScrollToTop', () => {
  const getRegisteredRef = (): RefObject<{
    scrollToTop: () => void;
  } | null> => {
    const call = mockUseNavigationScrollToTop.mock.calls.at(-1);
    if (!call) {
      throw new Error('useScrollToTop was not registered');
    }
    // SAFETY: useScrollToTop (src/hooks/useScrollToTop.ts) always passes a
    // ref whose `.current` getter returns either null or
    // `{ scrollToTop }`; expo-router's exported ScrollableWrapper type is
    // wider only to cover its other callers' scroll/getNode variants.
    return call[0] as RefObject<{ scrollToTop: () => void } | null>;
  };

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
