import {
  type Dispatch,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { setMeasuredVideoLatencySeconds } from '@app/store/stream/video-latency';

import type { LiveStreamScreenAction } from '../util/liveStreamScreenReducer';

const CHAT_CONNECTION_FALLBACK_MS = 10_000;

export function useChatConnectionReadiness({
  dispatchUi,
  isStreamEnabled,
  normalizedLogin,
}: {
  dispatchUi: Dispatch<LiveStreamScreenAction>;
  isStreamEnabled: boolean;
  normalizedLogin: string;
}) {
  const streamSessionKey = `${isStreamEnabled}:${normalizedLogin}`;
  const lastStreamSessionKeyRef = useRef(streamSessionKey);

  useLayoutEffect(() => {
    if (lastStreamSessionKeyRef.current === streamSessionKey) {
      return;
    }

    lastStreamSessionKeyRef.current = streamSessionKey;
    setMeasuredVideoLatencySeconds(null);

    dispatchUi({
      type: 'setChatConnectionReady',
      isChatConnectionReady: !isStreamEnabled,
    });
  }, [dispatchUi, isStreamEnabled, streamSessionKey]);

  useEffect(() => {
    if (!normalizedLogin || !isStreamEnabled) {
      return undefined;
    }

    const fallbackTimer = setTimeout(() => {
      dispatchUi({
        type: 'setChatConnectionReady',
        isChatConnectionReady: true,
      });
    }, CHAT_CONNECTION_FALLBACK_MS);

    return () => clearTimeout(fallbackTimer);
  }, [dispatchUi, isStreamEnabled, normalizedLogin]);

  return useCallback(() => {
    dispatchUi({ type: 'setChatConnectionReady', isChatConnectionReady: true });
  }, [dispatchUi]);
}
