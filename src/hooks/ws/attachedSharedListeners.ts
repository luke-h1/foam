import {
  DEFAULT_RECONNECT_INTERVAL_MS,
  DEFAULT_RECONNECT_LIMIT,
  ReadyState,
} from './constants';
import { getSubscribers } from './manage-subscribers';
import { sharedWebSockets, type WebSocketEventMap } from './types';

export const attachSharedListeners = (instance: WebSocket, url: string) => {
  instance.onmessage = (message: WebSocketEventMap['message']) => {
    getSubscribers(url).forEach(subscriber => {
      if (subscriber.optionsRef.current.onMessage) {
        subscriber.optionsRef.current.onMessage(message);
      }

      if (
        typeof subscriber.optionsRef.current.filter === 'function' &&
        subscriber.optionsRef.current.filter(message) !== true
      ) {
        return;
      }

      subscriber.setLastMessage(message);
    });
  };

  instance.onclose = (event: WebSocketEventMap['close']) => {
    getSubscribers(url).forEach(subscriber => {
      if (subscriber.optionsRef.current.onClose) {
        subscriber.optionsRef.current.onClose(event);
      }

      subscriber.setReadyState(ReadyState.CLOSED);
    });

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete sharedWebSockets[url];

    getSubscribers(url).forEach(subscriber => {
      if (
        subscriber.optionsRef.current.shouldReconnect &&
        subscriber.optionsRef.current.shouldReconnect(event)
      ) {
        const reconnectAttempts =
          subscriber.optionsRef.current.reconnectAttempts ??
          DEFAULT_RECONNECT_LIMIT;
        const baseInterval =
          subscriber.optionsRef.current.reconnectInterval ??
          DEFAULT_RECONNECT_INTERVAL_MS;
        if (subscriber.reconnectCount.current < reconnectAttempts) {
          // eslint-disable-next-line no-plusplus
          if (subscriber.reconnectCount.current++ === 0) {
            subscriber.reconnect.current();
          } else {
            const attempt = subscriber.reconnectCount.current;
            const backoffMultiplier = Math.min(1.5 ** attempt, 8);
            const delay = Math.round(baseInterval * backoffMultiplier);
            setTimeout(() => {
              subscriber.reconnect.current();
            }, delay);
          }
        } else {
          if (
            typeof subscriber.optionsRef.current.onReconnectStop === 'function'
          ) {
            subscriber.optionsRef.current.onReconnectStop(
              subscriber.optionsRef.current.reconnectAttempts as number,
            );
          }
          console.error(
            `Max reconnect attempts of ${reconnectAttempts} exceeded`,
          );
        }
      }
    });
  };

  instance.onerror = (error: WebSocketEventMap['error']) => {
    getSubscribers(url).forEach(subscriber => {
      if (subscriber.optionsRef.current.onError) {
        subscriber.optionsRef.current.onError(error);
      }
    });
  };

  instance.onopen = () => {
    getSubscribers(url).forEach(subscriber => {
      subscriber.reconnectCount.current = 0;
      if (subscriber.optionsRef.current.onOpen) {
        subscriber.optionsRef.current.onOpen();
      }

      subscriber.setReadyState(ReadyState.OPEN);
    });
  };
};
