import type { WebViewMessageEvent } from 'react-native-webview';

import { act, renderHook } from '@testing-library/react-native';

import * as sentry from '@app/lib/sentry';
import { silenceLogger } from '@app/test/silence-logger';

import { usePlayerBridge } from '../hooks/use-player-bridge';
import type { PlayerMessage } from '../types';

const mockCountMetric = jest
  .spyOn(sentry, 'countMetric')
  .mockImplementation(() => {});

jest.spyOn(sentry, 'endSpan').mockImplementation(() => {});
jest.spyOn(sentry, 'startInactiveSpan').mockImplementation(() => undefined);

silenceLogger();

function messageEvent(message: PlayerMessage): WebViewMessageEvent {
  // SAFETY: the bridge reads only nativeEvent.data off the message event.
  return {
    nativeEvent: { data: JSON.stringify(message) },
  } as WebViewMessageEvent;
}

const HIGH_LATENCY = messageEvent({
  type: 'playbackStats',
  payload: { hlsLatencyBroadcaster: 25 },
});

const STALLED = messageEvent({
  type: 'stalled',
  payload: { frozenMs: 14_000 },
});

function reportHighLatency(
  handleMessage: (event: WebViewMessageEvent) => void,
) {
  act(() => {
    handleMessage(HIGH_LATENCY);
    handleMessage(HIGH_LATENCY);
    handleMessage(HIGH_LATENCY);
  });
}

interface RenderBridgeOptions {
  enhancedStabilityEnabled?: boolean;
  forceRefresh?: () => void;
}

function renderBridge({
  enhancedStabilityEnabled = true,
  forceRefresh = jest.fn(),
}: RenderBridgeOptions = {}) {
  return renderHook(
    (props: { sourceKey: string }) =>
      usePlayerBridge({
        autoplay: true,
        channel: 'foo',
        contentKind: 'live',
        deferOverlayUntilUserUnmute: false,
        enhancedStabilityEnabled,
        forceRefresh,
        initialMuted: true,
        resumeTimeRef: { current: 0 },
        runJavaScript: jest.fn(),
        scheduleAuthCompletionReload: jest.fn(),
        sourceKey: props.sourceKey,
        webViewKey: 0,
      }),
    { initialProps: { sourceKey: 'foo' } },
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

  test('hard-refreshes after 3 high-latency readings', () => {
    const forceRefresh = jest.fn();
    const { result } = renderBridge({ forceRefresh });

    act(() => {
      result.current.handleMessage(HIGH_LATENCY);
      result.current.handleMessage(HIGH_LATENCY);
    });

    expect(forceRefresh).not.toHaveBeenCalled();

    act(() => {
      result.current.handleMessage(HIGH_LATENCY);
    });

    expect(forceRefresh).toHaveBeenCalledTimes(1);
  });

  test('does nothing when enhanced stability is disabled', () => {
    const forceRefresh = jest.fn();
    const { result } = renderBridge({
      enhancedStabilityEnabled: false,
      forceRefresh,
    });

    reportHighLatency(result.current.handleMessage);

    expect(forceRefresh).not.toHaveBeenCalled();
  });

  test('keeps recording load metrics after the player source changes', () => {
    const { result, rerender } = renderBridge();

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

  test('a stall remount preserves the budget, so a wedged stream still gives up', () => {
    // A real stall refresh remounts the webview (webViewKey bumps). Wire
    // forceRefresh to that remount so the reset effect runs just like on
    // device. The budget must survive the remount or the stream reloads
    // forever.
    let webViewKey = 0;

    const forceRefresh = jest.fn(() => {
      webViewKey += 1;
      rerender({ webViewKey });
    });

    const { result, rerender } = renderHook(
      (props: { webViewKey: number }) =>
        usePlayerBridge({
          autoplay: true,
          channel: 'foo',
          contentKind: 'live',
          deferOverlayUntilUserUnmute: false,
          enhancedStabilityEnabled: true,
          forceRefresh,
          initialMuted: true,
          resumeTimeRef: { current: 0 },
          runJavaScript: jest.fn(),
          scheduleAuthCompletionReload: jest.fn(),
          sourceKey: 'foo',
          webViewKey: props.webViewKey,
        }),
      { initialProps: { webViewKey } },
    );

    for (let attempt = 0; attempt < 5; attempt += 1) {
      act(() => {
        result.current.handleMessage(STALLED);
      });
    }

    expect(forceRefresh).toHaveBeenCalledTimes(3);
  });

  test('resets the auto-refresh window when the player source changes', () => {
    const forceRefresh = jest.fn();
    const { result, rerender } = renderBridge({ forceRefresh });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      reportHighLatency(result.current.handleMessage);
    }

    expect(forceRefresh).toHaveBeenCalledTimes(3);

    act(() => {
      rerender({ sourceKey: 'bar' });
    });

    reportHighLatency(result.current.handleMessage);

    expect(forceRefresh).toHaveBeenCalledTimes(4);
  });
});
