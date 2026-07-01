import type { WebViewMessageEvent } from 'react-native-webview';

import { act, renderHook } from '@testing-library/react-native';

import type { PlayerMessage } from '../types';
import { usePlayerBridge } from '../usePlayerBridge';

jest.mock('@app/lib/sentry', () => ({
  countMetric: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    main: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

function messageEvent(message: PlayerMessage): WebViewMessageEvent {
  return {
    nativeEvent: { data: JSON.stringify(message) },
  } as WebViewMessageEvent;
}

const STALLED = messageEvent({
  type: 'playbackStalled',
  payload: { currentTime: 10, networkState: 2, readyState: 2, stalledMs: 6000 },
});

const RECOVERED = messageEvent({
  type: 'playbackRecovered',
  payload: { stalledMs: 6000 },
});

const VIDEO_ERROR = messageEvent({
  type: 'videoElementError',
  payload: { code: 3, message: 'decode', networkState: 2, readyState: 1 },
});

function renderBridge(
  enhancedStabilityEnabled: boolean,
  forceRefresh: () => void,
) {
  return renderHook(() =>
    usePlayerBridge({
      autoplay: true,
      channel: 'foo',
      deferOverlayUntilUserUnmute: false,
      enhancedStabilityEnabled,
      forceRefresh,
      initialMuted: true,
      runJavaScript: jest.fn(),
      scheduleAuthCompletionReload: jest.fn(),
      sourceKey: 'foo',
      webViewKey: 0,
    }),
  );
}

describe('usePlayerBridge enhanced stability', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('hard-refreshes after a stall persists past the grace window', () => {
    const forceRefresh = jest.fn();
    const { result } = renderBridge(true, forceRefresh);

    act(() => {
      result.current.handleMessage(STALLED);
    });
    expect(forceRefresh).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(forceRefresh).toHaveBeenCalledTimes(1);
  });

  test('a stall recovery before the grace window cancels the refresh', () => {
    const forceRefresh = jest.fn();
    const { result } = renderBridge(true, forceRefresh);

    act(() => {
      result.current.handleMessage(STALLED);
    });
    act(() => {
      result.current.handleMessage(RECOVERED);
    });
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(forceRefresh).not.toHaveBeenCalled();
  });

  test('a fatal video-element error refreshes immediately', () => {
    const forceRefresh = jest.fn();
    const { result } = renderBridge(true, forceRefresh);

    act(() => {
      result.current.handleMessage(VIDEO_ERROR);
    });

    expect(forceRefresh).toHaveBeenCalledTimes(1);
  });

  test('does nothing when enhanced stability is disabled', () => {
    const forceRefresh = jest.fn();
    const { result } = renderBridge(false, forceRefresh);

    act(() => {
      result.current.handleMessage(STALLED);
      result.current.handleMessage(VIDEO_ERROR);
    });
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(forceRefresh).not.toHaveBeenCalled();
  });

  test('caps auto-refreshes so a broken stream cannot loop forever', () => {
    const forceRefresh = jest.fn();
    const { result } = renderBridge(true, forceRefresh);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      act(() => {
        result.current.handleMessage(VIDEO_ERROR);
      });
    }

    expect(forceRefresh).toHaveBeenCalledTimes(3);
  });
});
