import { RefObject } from 'react';

import { logger } from '@app/utils/logger';

import {
  DEFAULT_RECONNECT_INTERVAL_MS,
  DEFAULT_RECONNECT_LIMIT,
  FAST_FIRST_RECONNECT_INTERVAL_MS,
  ReadyState,
} from './constants';
import type { Options, WebSocketEventMap } from './types';

export function getReconnectDelay(
  attempt: number,
  baseInterval: number,
): number {
  if (attempt === 0) {
    return FAST_FIRST_RECONNECT_INTERVAL_MS;
  }
  return Math.round(baseInterval * Math.min(1.5 ** (attempt - 1), 8));
}

const RECONNECT_MAX_JITTER_MS = 250;

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
    const reconnectAttempts =
      optionsRef.current.reconnectAttempts ?? DEFAULT_RECONNECT_LIMIT;
    if (reconnectCount.current >= reconnectAttempts) {
      logger.main.error(
        `Maximum reconnect attempts reached: ${reconnectAttempts}`,
      );
      return;
    }
    const baseInterval =
      optionsRef.current.reconnectInterval ?? DEFAULT_RECONNECT_INTERVAL_MS;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(
      () => {
        reconnectTimeout = undefined;
        reconnectCount.current += 1;
        reconnect();
      },
      getReconnectDelay(reconnectCount.current, baseInterval) +
        Math.random() * RECONNECT_MAX_JITTER_MS,
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
    instance.close();
  };
}
