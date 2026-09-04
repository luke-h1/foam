import { useCallback, useEffect, useRef, useState } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';

import { attachListeners } from './attachListener';
import { ReadyState } from './constants';
import type {
  Options,
  SendJsonMessage,
  SendMessage,
  WebSocketHookReturn,
} from './types';

// Dummy socket so callers never get null before init. SAFETY: built from WebSocket.prototype; only the two properties defined here are read.
const dummySocket = Object.create(WebSocket.prototype) as WebSocket;
Object.defineProperty(dummySocket, 'readyState', {
  value: WebSocket.CLOSED,
  writable: false,
  enumerable: true,
  configurable: false,
});
Object.defineProperty(dummySocket, 'url', {
  value: '',
  writable: false,
  enumerable: true,
  configurable: false,
});

export const useWebsocket = <TJsonMessage = never>(
  url: string | null,
  options: Options = {},
): WebSocketHookReturn<TJsonMessage> => {
  const [readyStateByUrl, setReadyStateByUrl] = useState<
    Partial<Record<string, ReadyState>>
  >({});
  const websocketRef = useRef<WebSocket | null>(null);
  const startRef = useRef<() => void>(() => {});
  const reconnectCount = useRef<number>(0);
  const optionsCache = useSyncRef(options);

  const readyState: ReadyState =
    (url === null ? undefined : readyStateByUrl[url]) ??
    (url === null ? ReadyState.UNINSTANTIATED : ReadyState.CONNECTING);

  // Non-OPEN sends are dropped; consumers re-issue on open/reconnect.
  const sendMessage: SendMessage = useCallback(message => {
    if (
      websocketRef.current &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      websocketRef.current.readyState === ReadyState.OPEN
    ) {
      websocketRef.current.send(message);
    }
  }, []);

  const sendJsonMessage: SendJsonMessage<TJsonMessage> = message => {
    sendMessage(JSON.stringify(message));
  };

  const getWebSocket = useCallback(
    (): WebSocket => websocketRef.current ?? dummySocket,
    [],
  );

  useEffect(() => {
    if (url === null) {
      return undefined;
    }
    let removeListeners: (() => void) | undefined;
    let expectClose = false;

    const setReadyState = (state: ReadyState) => {
      if (!expectClose) {
        setReadyStateByUrl(prev => ({ ...prev, [url]: state }));
      }
    };

    const start = () => {
      setReadyState(ReadyState.CONNECTING);
      const socket = new WebSocket(url);
      websocketRef.current = socket;
      removeListeners = attachListeners(
        socket,
        setReadyState,
        optionsCache,
        () => startRef.current(),
        reconnectCount,
      );
    };
    startRef.current = () => {
      if (!expectClose) {
        removeListeners?.();
        start();
      }
    };

    start();
    return () => {
      expectClose = true;
      removeListeners?.();
    };
  }, [url, optionsCache]);

  // Fresh connection that revives a socket whose retries were exhausted, e.g. on foreground after a long outage.
  const reconnect = useCallback(() => {
    reconnectCount.current = 0;
    startRef.current();
  }, []);

  return {
    sendMessage,
    sendJsonMessage,
    readyState,
    getWebSocket,
    reconnect,
  };
};
