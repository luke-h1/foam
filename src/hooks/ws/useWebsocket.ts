import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  RefObject,
} from 'react';
import { ReadyState } from './constants';
import { createOrJoinSocket } from './createOrJoin';
import { getUrl } from './get-url';
import { websocketWrapper } from './proxy';
import {
  Options,
  ReadyStateState,
  SendJsonMessage,
  SendMessage,
  WebSocketHookReturn,
  WebSocketMessage,
  sharedWebSockets,
} from './types';

export const useWebsocket = (
  url: string | (() => string | Promise<string>) | null,
  options: Options = {},
  connect = true,
): WebSocketHookReturn => {
  const [lastMessage, setLastMessage] =
    useState<WebSocketEventMap['message']>();
  const [readyState, setReadyState] = useState<ReadyStateState>({});

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const lastJsonMessage = useMemo(() => {
    if (lastMessage) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(lastMessage.data as string);
      } catch {
        return {};
      }
    }
    return null;
  }, [lastMessage]);

  const convertedUrl = useRef<string>('');
  const websocketRef = useRef<WebSocket | null>(null);
  const startRef = useRef<() => void>(() => {});
  const reconnectCount = useRef<number>(0);
  const messageQueue = useRef<WebSocketMessage[]>([]);
  const webSocketProxy = useRef<WebSocket | null>(null);
  const optionsCache = useRef<Options>(options);

  const readyStateFromUrl: ReadyState =
    // eslint-disable-next-line no-nested-ternary
    convertedUrl.current && readyState[convertedUrl.current] !== undefined
      ? (readyState[convertedUrl.current] as ReadyState)
      : url !== null && connect === true
        ? ReadyState.CONNECTING
        : ReadyState.UNINSTANTIATED;

  const stringifiedQueryParams = options.queryParams
    ? JSON.stringify(options.queryParams)
    : null;

  const sendMessage: SendMessage = useCallback(message => {
    if (
      websocketRef.current &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      websocketRef.current.readyState === ReadyState.OPEN
    ) {
      websocketRef.current.send(message);
    } else {
      messageQueue.current.push(message);
    }
  }, []);

  const sendJsonMessage: SendJsonMessage = useCallback(
    message => {
      sendMessage(JSON.stringify(message));
    },
    [sendMessage],
  );

  const getWebSocket = useCallback((): WebSocket => {
    /**
     * For non-shared connections, return the direct websocket if available
     */
    if (optionsCache.current?.share !== true && websocketRef.current !== null) {
      return websocketRef.current;
    }

    /**
     * For shared connections, use the proxy
     */
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

    /**
     * If we have a websocket ref, return it (even if proxy isn't set up yet)
     */
    if (websocketRef.current !== null) {
      return websocketRef.current;
    }

    /**
     * For shared connections, check the shared WebSockets map if the socket is already created.
     */
    if (optionsCache.current?.share && convertedUrl.current) {
      const sharedSocket = sharedWebSockets[convertedUrl.current];
      if (sharedSocket !== undefined) {
        return sharedSocket;
      }
    }

    /**
     * This is a dummy WebSocket object that is used to prevent null errors when the WebSocket is not initialized yet.
     */
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
    if (url !== null && connect === true) {
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
          websocketRef as RefObject<WebSocket>,
          convertedUrl.current,
          protectedSetReadyState as (readyState: ReadyState) => void,
          optionsCache,
          protectedSetLastMessage,
          startRef,
          reconnectCount,
        );
      };
      startRef.current = () => {
        if (!expectClose) {
          if (webSocketProxy.current) webSocketProxy.current = null;
          removeListeners?.();
          void start();
        }
      };

      void start();
      return () => {
        expectClose = true;
        if (webSocketProxy.current) webSocketProxy.current = null;
        removeListeners?.();
        setLastMessage(undefined);
      };
    }
    return undefined;
  }, [url, connect, stringifiedQueryParams, optionsCache, sendMessage]);

  useEffect(() => {
    if (readyStateFromUrl === ReadyState.OPEN) {
      messageQueue.current.splice(0).forEach(message => {
        sendMessage(message);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyStateFromUrl]);

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage: lastMessage as WebSocketEventMap['message'],
    lastJsonMessage,
    readyState: readyStateFromUrl,
    getWebSocket,
  };
};
