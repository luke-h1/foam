import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';

/**
 * Captures the tracker's `vodProgress` messages for resume-on-reload;
 * everything else forwards to the player bridge.
 */
export function useWebViewMessageRouter({
  handleMessage,
  resumeTimeRef,
}: {
  handleMessage: (event: WebViewMessageEvent) => void;
  resumeTimeRef: RefObject<number>;
}) {
  return useCallback(
    (event: WebViewMessageEvent) => {
      try {
        // SAFETY: only the tracker script sends `vodProgress`; fields are re-checked before use.
        const message = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          payload?: { currentTime?: number };
        };

        const time =
          message.type === 'vodProgress'
            ? message.payload?.currentTime
            : undefined;

        if (time !== undefined && Number.isFinite(time)) {
          resumeTimeRef.current = time;
        }

        if (message.type === 'vodProgress') {
          return;
        }
      } catch {
        // Fall through to the bridge for non-JSON / unexpected payloads.
      }

      handleMessage(event);
    },
    [handleMessage, resumeTimeRef],
  );
}
