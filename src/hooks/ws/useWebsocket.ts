import { useCallback, useEffect, useRef, useState } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';

import { ReadyState } from './constants';
import { createOrJoinSocket } from './createOrJoin';
import { getUrl } from './get-url';
import { websocketWrapper } from './proxy';
import {
  Options,
  ReadyStateState,
  SendJsonMessage,
  SendMessage,
  sharedWebSockets,
  WebSocketHookReturn,
} from './types';

export const useWebsocket = <TJsonMessage = never>(
  url: string | (() => string | Promise<string>) | null,
  options: Options = {},
  connect = true,
): WebSocketHookReturn<
  WebSocketEventMap['message'] | undefined,
  TJsonMessage
> => {
  const [lastMessage, setLastMessage] =
    useState<WebSocketEventMap['message']>();
  const [readyState, setReadyState] = useState<ReadyStateState>({});

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const lastJsonMessage = null;

  const convertedUrl = useRef<string>('');
  const websocketRef = useRef<WebSocket | null>(null);
  const startRef = useRef<() => void>(() => {});
  const reconnectCount = useRef<number>(0);
  const webSocketProxy = useRef<WebSocket | null>(null);
  const optionsCache = useSyncRef(options);
  const connectRef = useSyncRef(connect);

  /**
   * The connect effect resolves `convertedUrl` asynchronously, so ready state must derive from the ref during render.
   */
  // react-doctor-disable-next-line react-hooks-js/refs -- see above
  const activeUrl = convertedUrl.current;
  const readyStateFromUrl: ReadyState =
    (activeUrl ? readyState[activeUrl] : undefined) ??
    (url !== null && connect
      ? ReadyState.CONNECTING
      : ReadyState.UNINSTANTIATED);

  const stringifiedQueryParams = options.queryParams
    ? JSON.stringify(options.queryParams)
    : null;

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

  const getWebSocket = useCallback((): WebSocket => {
    if (optionsCache.current?.share !== true && websocketRef.current !== null) {
      return websocketRef.current;
    }

    if (
      webSocketProxy.current === null &&
      websocketRef.current &&
      startRef.current() !== undefined
    ) {
      webSocketProxy.current = websocketWrapper(websocketRef.current, startRef);
      return webSocketProxy.current;
    }

    if (webSocketProxy.current !== null) {
      return webSocketProxy.current;
    }

    if (websocketRef.current !== null) {
      return websocketRef.current;
    }

    if (optionsCache.current?.share && convertedUrl.current) {
      const sharedSocket = sharedWebSockets[convertedUrl.current];
      if (sharedSocket !== undefined) {
        return sharedSocket;
      }
    }

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
    return dummySocket;
  }, [optionsCache]);

  useEffect(() => {
    if (url !== null && connectRef.current === true) {
      let removeListeners: () => void;
      let expectClose = false;

      const start = async () => {
        convertedUrl.current = await getUrl(url, optionsCache);

        const protectedSetLastMessage = (
          message: WebSocketEventMap['message'],
        ) => {
          if (!expectClose) {
            setLastMessage(message);
          }
        };

        const protectedSetReadyState = (state: ReadyState) => {
          if (!expectClose) {
            setReadyState(prev => ({
              ...prev,
              [convertedUrl.current]: state,
            }));
          }
        };

        removeListeners = createOrJoinSocket(
          websocketRef,
          convertedUrl.current,
          protectedSetReadyState,
          optionsCache,
          protectedSetLastMessage,
          startRef,
          reconnectCount,
        );
      };
      startRef.current = () => {
        if (!expectClose) {
          if (webSocketProxy.current) {
            webSocketProxy.current = null;
          }
          removeListeners?.();
          void start();
        }
      };

      void start();
      const webSocketProxyRef = webSocketProxy;
      return () => {
        expectClose = true;
        if (webSocketProxyRef.current) {
          webSocketProxyRef.current = null;
        }
        removeListeners?.();
        setLastMessage(undefined);
      };
    }
    return undefined;
  }, [url, stringifiedQueryParams, optionsCache, connectRef]);

  // Fresh connection that revives a socket whose retries were exhausted, e.g. on foreground after a long outage.
  const reconnect = useCallback(() => {
    reconnectCount.current = 0;
    startRef.current();
  }, []);

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState: readyStateFromUrl,
    getWebSocket,
    reconnect,
  };
};
