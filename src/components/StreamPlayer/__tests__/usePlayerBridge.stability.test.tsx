import type { WebViewMessageEvent } from 'react-native-webview';

import { act, renderHook } from '@testing-library/react-native';

import * as sentry from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

import type { PlayerMessage } from '../types';
import { usePlayerBridge } from '../usePlayerBridge';

const mockCountMetric = jest
  .spyOn(sentry, 'countMetric')
  .mockImplementation(() => {});
jest.spyOn(sentry, 'endSpan').mockImplementation(() => {});
jest.spyOn(sentry, 'startInactiveSpan').mockImplementation(() => undefined);

jest.spyOn(logger.main, 'debug').mockImplementation(() => {});
jest.spyOn(logger.main, 'info').mockImplementation(() => {});
jest.spyOn(logger.main, 'warn').mockImplementation(() => {});
jest.spyOn(logger.main, 'error').mockImplementation(() => {});

function messageEvent(message: PlayerMessage): WebViewMessageEvent {
  // SAFETY: the bridge reads only nativeEvent.data off the message event.
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
      contentKind: 'live',
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

  test('keeps recording load metrics after the player source changes', () => {
    const { result, rerender } = renderHook(
      (props: { sourceKey: string }) =>
        usePlayerBridge({
          autoplay: true,
          channel: 'foo',
          contentKind: 'live',
          deferOverlayUntilUserUnmute: false,
          enhancedStabilityEnabled: true,
          forceRefresh: jest.fn(),
          initialMuted: true,
          runJavaScript: jest.fn(),
          scheduleAuthCompletionReload: jest.fn(),
          sourceKey: props.sourceKey,
          webViewKey: 0,
        }),
      { initialProps: { sourceKey: 'foo' } },
    );

    act(() => {
      rerender({ sourceKey: 'bar' });
    });
    mockCountMetric.mockClear();

    act(() => {
      result.current.noteWebViewPlaybackStarted();
    });

    const startCall = mockCountMetric.mock.calls.find(
      ([name]) => name === 'stream.player.start',
    );
    expect(startCall).toEqual([
      'stream.player.start',
      {
        autoplay: true,
        channel: 'foo',
        content_kind: 'live',
        elapsed_ms: 0,
        outcome: 'started',
        start_source: 'webview_loaded',
      },
    ]);
  });

  test('resets the auto-refresh window when the player source changes', () => {
    const forceRefresh = jest.fn();
    const { result, rerender } = renderHook(
      (props: { sourceKey: string }) =>
        usePlayerBridge({
          autoplay: true,
          channel: 'foo',
          contentKind: 'live',
          deferOverlayUntilUserUnmute: false,
          enhancedStabilityEnabled: true,
          forceRefresh,
          initialMuted: true,
          runJavaScript: jest.fn(),
          scheduleAuthCompletionReload: jest.fn(),
          sourceKey: props.sourceKey,
          webViewKey: 0,
        }),
      { initialProps: { sourceKey: 'foo' } },
    );

    for (let attempt = 0; attempt < 5; attempt += 1) {
      act(() => {
        result.current.handleMessage(VIDEO_ERROR);
      });
    }
    expect(forceRefresh).toHaveBeenCalledTimes(3);

    act(() => {
      rerender({ sourceKey: 'bar' });
    });

    act(() => {
      result.current.handleMessage(VIDEO_ERROR);
    });
    expect(forceRefresh).toHaveBeenCalledTimes(4);
  });
});
