import {
  type Dispatch,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { setMeasuredVideoLatencySeconds } from '@app/store/stream/video-latency';

import type { LiveStreamScreenAction } from '../util/live-stream-screen-reducer';

/**
 * Chat waits for the player to report it is running so the two start in sync.
 * This is the backstop for a player that never reports.
 */
const CHAT_CONNECTION_FALLBACK_MS = 10_000;

/**
 * Tracks whether chat is clear to connect. Switching channel resets the gate;
 * the player reporting loaded, or the fallback timer, opens it.
 */
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
