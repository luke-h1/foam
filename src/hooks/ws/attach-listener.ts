import type { RefObject } from 'react';

import { getReconnectDelay } from '@app/utils/async/reconnectPolicy';
import { logger } from '@app/utils/logger';

import { ReadyState } from './constants';
import type { Options, WebSocketEventMap } from './types';

export function attachListeners(
  instance: WebSocket,
  setReadyState: (readyState: ReadyState) => void,
  optionsRef: RefObject<Options>,
  reconnect: () => void,
  reconnectCount: RefObject<number>,
): () => void {
  let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

  instance.onmessage = (message: WebSocketEventMap['message']) => {
    optionsRef.current.onMessage?.(message);
  };

  instance.onopen = () => {
    optionsRef.current.onOpen?.();
    reconnectCount.current = 0;
    setReadyState(ReadyState.OPEN);
  };

  instance.onclose = (event: WebSocketEventMap['close']) => {
    optionsRef.current.onClose?.(event);
    setReadyState(ReadyState.CLOSED);

    if (!optionsRef.current.shouldReconnect?.(event)) {
      return;
    }

    const policy = optionsRef.current.reconnectPolicy;

    if (reconnectCount.current >= policy.maxAttempts) {
      logger.main.error(
        `Maximum reconnect attempts reached: ${policy.maxAttempts}`,
      );
      return;
    }

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    reconnectTimeout = setTimeout(
      () => {
        reconnectTimeout = undefined;
        reconnectCount.current += 1;
        reconnect();
      },
      getReconnectDelay(reconnectCount.current, policy),
    );
  };

  instance.onerror = (event: WebSocketEventMap['error']) => {
    optionsRef.current.onError?.(event);
  };

  return () => {
    setReadyState(ReadyState.CLOSING);

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    // A replaced socket that closes late must not reach the new connection's callbacks or state.
    instance.onopen = null;
    instance.onmessage = null;
    instance.onerror = null;
    instance.onclose = null;
    instance.close();
  };
}
