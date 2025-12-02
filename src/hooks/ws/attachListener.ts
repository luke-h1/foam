/* eslint-disable no-undef */
import { RefObject } from 'react';
import {
  DEFAULT_RECONNECT_INTERVAL_MS,
  DEFAULT_RECONNECT_LIMIT,
  ReadyState,
  setupSocketPing,
} from './constants';
import type { Options, WebSocketEventMap } from './types';

export interface Setters {
  setLastMessage: (message: WebSocketEventMap['message']) => void;
  setReadyState: (readyState: ReadyState) => void;
}

export function attachListeners(
  instance: WebSocket,
  setters: Setters,
  optionsRef: RefObject<Options>,
  reconnect: () => void,
  reconnectCount: RefObject<number>,
): () => void {
  const { setLastMessage, setReadyState } = setters;

  let interval: NodeJS.Timeout;
  let reconnectTimeout: NodeJS.Timeout;

  if (optionsRef.current.fromSocketIO) {
    interval = setupSocketPing(instance);
  }

  instance.onmessage = (message: WebSocketEventMap['message']) => {
    optionsRef.current.onMessage?.(message);

    if (
      typeof optionsRef.current.filter === 'function' &&
      optionsRef.current.filter(message) !== true
    ) {
      return;
    }
    setLastMessage(message);
  };

  instance.onopen = () => {
    optionsRef.current.onOpen?.();
    reconnectCount.current = 0;
    setReadyState(ReadyState.OPEN);
  };

  instance.onclose = (event: WebSocketEventMap['close']) => {
    optionsRef.current.onClose?.(event);
    setReadyState(ReadyState.CLOSED);

    if (
      optionsRef.current.shouldReconnect &&
      optionsRef.current.shouldReconnect(event)
    ) {
      const reconnectAttempts =
        optionsRef.current.reconnectAttempts ?? DEFAULT_RECONNECT_LIMIT;

      if (reconnectCount.current < reconnectAttempts) {
        reconnectTimeout = setTimeout(() => {
          reconnectCount.current += 1;
          reconnect();
        }, optionsRef.current.reconnectInterval ?? DEFAULT_RECONNECT_INTERVAL_MS);
      }

      optionsRef.current.onReconnectStop?.(reconnectAttempts);
      console.error(`Maximum reconnect attempts reached: ${reconnectAttempts}`);
    }
  };

  instance.onerror = (event: WebSocketEventMap['error']) => {
    optionsRef.current.onError?.(event);

    if (optionsRef.current.retryOnError) {
      if (
        reconnectCount.current <
        (optionsRef.current.reconnectAttempts ?? DEFAULT_RECONNECT_LIMIT)
      ) {
        reconnectTimeout = setTimeout(() => {
          reconnectCount.current += 1;
          reconnect();
        }, optionsRef.current.reconnectInterval ?? DEFAULT_RECONNECT_LIMIT);
      }

      optionsRef.current.onReconnectStop?.(
        optionsRef.current.reconnectAttempts as number,
      );
      console.error(
        `Maximum reconnect attempts reached: ${optionsRef.current.reconnectAttempts}`,
      );
    }
  };

  return () => {
    setReadyState(ReadyState.CLOSING);
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    instance.close();
    if (interval) {
      clearInterval(interval);
    }
  };
}
