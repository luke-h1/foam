import type { WebViewMessageEvent } from 'react-native-webview';

import { act, renderHook } from '@testing-library/react-native';

import { silenceLogger } from '@app/test/silence-logger';
import { logger } from '@app/utils/logger';

import { usePlayerBridge } from '../hooks/use-player-bridge';

silenceLogger();

const errorLog = jest.spyOn(logger.main, 'error').mockImplementation(() => {});

function messageEvent(data: string): WebViewMessageEvent {
  // SAFETY: the bridge reads only nativeEvent.data off the message event.
  return { nativeEvent: { data } } as WebViewMessageEvent;
}

function renderBridge(onReady?: () => void) {
  const resumeTimeRef = { current: 0 };

  const { result } = renderHook(() =>
    usePlayerBridge({
      autoplay: true,
      channel: 'foo',
      contentKind: 'vod',
      deferOverlayUntilUserUnmute: false,
      enhancedStabilityEnabled: false,
      forceRefresh: jest.fn(),
      initialMuted: true,
      onReady,
      resumeTimeRef,
      runJavaScript: jest.fn(),
      scheduleAuthCompletionReload: jest.fn(),
      sourceKey: 'foo',
      webViewKey: 0,
    }),
  );

  return { result, resumeTimeRef };
}

describe('usePlayerBridge handleMessage', () => {
  test('stores the VOD position from a vodProgress message', () => {
    const { result, resumeTimeRef } = renderBridge();

    act(() => {
      result.current.handleMessage(
        messageEvent('{"type":"vodProgress","payload":{"currentTime":61}}'),
      );
    });

    expect(resumeTimeRef.current).toBe(61);
  });

  test('ignores a message that is not JSON', () => {
    const { result } = renderBridge();

    act(() => {
      result.current.handleMessage(messageEvent('not json'));
    });

    expect(errorLog).not.toHaveBeenCalled();
  });

  test('logs an action that throws instead of dropping it', () => {
    const failure = new Error('onReady failed');

    const { result } = renderBridge(() => {
      throw failure;
    });

    act(() => {
      result.current.handleMessage(messageEvent('{"type":"ready"}'));
    });

    expect(errorLog.mock.calls).toEqual([
      ['Failed to run player bridge action', { error: failure, type: 'ready' }],
    ]);
  });
});
