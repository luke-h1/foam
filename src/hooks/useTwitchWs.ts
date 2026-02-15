import { twitchService } from '@app/services/twitch-service';
import { logger } from '@app/utils/logger';
import { useNavigationState } from '@react-navigation/native';
import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { CHAT_SCREENS } from '../constants/chat';
import { getActiveRouteName } from '../navigators/navigationUtilities';
import { useWebsocket } from './ws/useWebsocket';

interface EventSubMetadata {
  message_id: string;
  message_type:
    | 'session_welcome'
    | 'session_keepalive'
    | 'notification'
    | 'session_reconnect'
    | 'revocation';
  message_timestamp: string;
  subscription_type?: string;
  subscription_version?: string;
}

interface EventSubPayload {
  session?: {
    id: string;
    status: string;
    connected_at: string;
    keepalive_timeout_seconds: number;
    reconnect_url?: string;
  };
  subscription?: {
    id: string;
    status: string;
    type: string;
    version: string;
    condition: Record<string, string>;
    transport: {
      method: string;
      session_id: string;
    };
    created_at: string;
  };
}

interface EventSubMessage {
  metadata: EventSubMetadata;
  payload: EventSubPayload;
  event?: Record<string, unknown>;
}

type EventCallback = (data: EventSubMessage) => void;

const DEFAULT_URL = 'wss://eventsub.wss.twitch.tv/ws';

export function useTwitchWs(): WebSocket {
  const hasInitialized = useRef(false);
  const lastScreenRef = useRef<string | null>(null);

  // Session management
  const sessionIdRef = useRef<string>('');
  const keepaliveTimeoutRef = useRef<number>(10);
  const keepaliveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectUrlRef = useRef<string>('');
  const isReconnectingRef = useRef<boolean>(false);
  const [wsUrl, setWsUrl] = useState<string>(DEFAULT_URL);

  // Event callbacks and subscriptions
  const eventCallbacksRef = useRef<Map<string, EventCallback[]>>(new Map());
  const activeSubscriptionsRef = useRef<Map<string, string>>(new Map());
  const getWebSocketRef = useRef<(() => WebSocket) | null>(null);

  const currentScreen = useNavigationState(state => {
    if (!state) return null;
    return getActiveRouteName(state);
  }) as 'LiveStream' | 'Chat';

  // Determine if we should be connected based on screen
  const shouldConnect = useMemo(() => {
    if (!currentScreen) return false;
    return CHAT_SCREENS.includes(currentScreen);
  }, [currentScreen]);

  const clearKeepaliveTimer = useCallback(() => {
    if (keepaliveTimerRef.current) {
      clearTimeout(keepaliveTimerRef.current);
      keepaliveTimerRef.current = null;
    }
  }, []);

  const resetKeepaliveTimer = useCallback(() => {
    clearKeepaliveTimer();

    const timeoutInMs = (keepaliveTimeoutRef.current + 5) * 1000; // 5s buffer

    keepaliveTimerRef.current = setTimeout(() => {
      logger.twitchWs.warn(
        `💜 EventSub keepalive timeout received - reconnecting`,
      );
      // Trigger reconnection via getWebSocket and close/reconnect
      // This will be handled by useWebsocket's reconnection logic
    }, timeoutInMs);
  }, [clearKeepaliveTimer]);

  const handleSessionWelcome = useCallback(
    (message: EventSubMessage) => {
      const { session } = message.payload;

      if (!session) {
        logger.twitchWs.warn('🟣 No session found (handleSessionWelcome)');
        return;
      }

      sessionIdRef.current = session.id;
      keepaliveTimeoutRef.current = session.keepalive_timeout_seconds;

      logger.twitchWs.info(`🟣 EventSub session established: ${session.id}`);

      resetKeepaliveTimer();

      // Re-subscribe to any events that had callbacks registered
      const eventTypes = Array.from(eventCallbacksRef.current.keys());
      if (eventTypes.length > 0) {
        logger.twitchWs.info(
          `💜 Re-subscribing to ${eventTypes.length} event types`,
        );
        // Clear old subscription IDs since we have a new session
        activeSubscriptionsRef.current.clear();
        // Note: Cannot auto-resubscribe without version and condition info
        eventTypes.forEach(eventType => {
          logger.twitchWs.warn(
            `💜 Cannot auto-resubscribe to ${eventType} - need version and condition info`,
          );
        });
      }
    },
    [resetKeepaliveTimer],
  );

  const handleKeepAlive = useCallback(() => {
    logger.twitchWs.debug(`💜 EventSub keepalive event received`);
    resetKeepaliveTimer();
  }, [resetKeepaliveTimer]);

  const handleNotification = useCallback(
    (message: EventSubMessage) => {
      const subscriptionType = message.metadata.subscription_type;

      if (!subscriptionType) {
        logger.twitchWs.info(
          `🟣 no subscription type found (handleNotification)`,
        );
        return;
      }
      logger.twitchWs.info(
        `🟣 EventSub notification: ${JSON.stringify(subscriptionType, null, 2)}`,
      );

      const callbacks = eventCallbacksRef.current.get(subscriptionType);

      if (callbacks) {
        callbacks.forEach(cb => {
          try {
            cb(message);
          } catch (e) {
            logger.twitchWs.error(
              `💜 error in event CB: ${JSON.stringify(e, null, 2)}`,
            );
          }
        });
      }

      resetKeepaliveTimer();
    },
    [resetKeepaliveTimer],
  );

  const handleReconnect = useCallback((message: EventSubMessage) => {
    const { session } = message.payload;

    if (!session?.reconnect_url) {
      logger.twitchWs.warn('💜 no reconnect_url set (handleReconnect)');
      return;
    }

    logger.twitchWs.info(
      '💜 EventSub reconnect required. Received URL',
      session.reconnect_url,
    );

    reconnectUrlRef.current = session.reconnect_url;
    isReconnectingRef.current = true;
    setWsUrl(session.reconnect_url);

    // Close the current connection - useWebsocket will handle reconnection
    if (getWebSocketRef.current) {
      const ws = getWebSocketRef.current();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Reconnecting');
      }
    }
  }, []);

  const handleRevocation = useCallback((message: EventSubMessage) => {
    const { subscription } = message.payload;

    if (!subscription) {
      return;
    }

    logger.twitchWs.warn(
      `💜 EventSub subscription revoked: ${subscription.type}`,
    );
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as EventSubMessage;

        logger.twitchWs.debug(
          '🟣 EventSub message received:',
          message.metadata.message_type,
        );

        switch (message.metadata.message_type) {
          case 'session_welcome': {
            handleSessionWelcome(message);
            break;
          }

          case 'session_keepalive': {
            handleKeepAlive();
            break;
          }

          case 'notification': {
            handleNotification(message);
            break;
          }

          case 'session_reconnect': {
            handleReconnect(message);
            break;
          }

          case 'revocation': {
            handleRevocation(message);
            break;
          }

          default:
            logger.twitchWs.warn(
              '🟣 EventSub message not handled with type:',
              message.metadata.message_type,
            );
        }
      } catch (e) {
        logger.twitchWs.error('🟣 Failed to parse EventSub message:', e);
      }
    },
    [
      handleSessionWelcome,
      handleKeepAlive,
      handleNotification,
      handleReconnect,
      handleRevocation,
    ],
  );

  const cleanupSubscriptions = useCallback(async () => {
    const subscriptionIds = Array.from(activeSubscriptionsRef.current.values());

    if (subscriptionIds.length === 0) {
      return;
    }

    logger.twitchWs.info(
      `💜 Cleaning up ${subscriptionIds.length} subscriptions in background`,
    );

    activeSubscriptionsRef.current.clear();

    const cleanupTimeout = new Promise<void>(resolve => {
      setTimeout(() => {
        logger.twitchWs.warn(
          '💜 Subscription cleanup timed out, continuing...',
        );
        resolve();
      }, 5000); // 5 second timeout
    });

    const cleanupPromises = subscriptionIds.map(async subscriptionId => {
      try {
        const deletePromise =
          twitchService.deleteEventSubscription(subscriptionId);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 2000);
        });

        await Promise.race([deletePromise, timeoutPromise]);
        logger.twitchWs.info(`💜 Cleaned up subscription: ${subscriptionId}`);
      } catch (error) {
        logger.twitchWs.warn(
          `💜 Failed to cleanup subscription ${subscriptionId}:`,
          error,
        );
      }
    });

    await Promise.race([Promise.allSettled(cleanupPromises), cleanupTimeout]);
  }, []);

  const { getWebSocket } = useWebsocket(
    shouldConnect ? wsUrl : null,
    {
      onOpen: () => {
        logger.twitchWs.info('💜 twitch event sub WS connected');
        isReconnectingRef.current = false;
      },
      onMessage: (event: MessageEvent) => {
        handleMessage(event);
      },
      onClose: (event: CloseEvent) => {
        logger.twitchWs.warn(
          `🟣 Twitch EventSub WebSocket closed: ${event.code} - ${event.reason} - ${event.timeStamp}`,
        );
        clearKeepaliveTimer();

        // Handle 4003 (connection unused) - reset state since we're not reconnecting
        if (event.code === 4003) {
          const hasActiveSubscriptions =
            activeSubscriptionsRef.current.size > 0;
          if (!hasActiveSubscriptions) {
            logger.twitchWs.info(
              '🟣 Connection unused (4003) with no active subscriptions - not reconnecting',
            );
            reconnectUrlRef.current = '';
            setWsUrl(DEFAULT_URL);
            isReconnectingRef.current = false;
            return;
          }
        }

        // Reset reconnect URL if it was a normal closure
        if (event.code === 1000) {
          reconnectUrlRef.current = '';
          setWsUrl(DEFAULT_URL);
          isReconnectingRef.current = false;
        }
      },
      onError: (error: Event) => {
        logger.twitchWs.error('🟣 Twitch EventSub WebSocket error:', error);
      },
      shouldReconnect: (event: CloseEvent) => {
        // Don't reconnect on normal closure
        if (event.code === 1000) {
          return false;
        }

        // Don't reconnect on 4003 (connection unused) if we have no active subscriptions
        // Twitch closes unused connections, and reconnecting without subscriptions will just
        // result in another 4003 closure
        if (event.code === 4003) {
          const hasActiveSubscriptions =
            activeSubscriptionsRef.current.size > 0;
          if (!hasActiveSubscriptions) {
            logger.twitchWs.info(
              '🟣 Not reconnecting on 4003 - no active subscriptions to maintain',
            );
            return false;
          }
        }

        return shouldConnect;
      },
      reconnectAttempts: 30,
      reconnectInterval: 2000,
    },
    shouldConnect,
  );

  // Store getWebSocket in ref for use in callbacks
  useEffect(() => {
    getWebSocketRef.current = getWebSocket;
  }, [getWebSocket]);

  useEffect(() => {
    if (!currentScreen) return;

    const isOnChatScreen = CHAT_SCREENS.includes(currentScreen);
    const wasOnChatScreen = lastScreenRef.current
      ? CHAT_SCREENS.includes(lastScreenRef.current as 'LiveStream' | 'Chat')
      : false;

    logger.twitchWs.info('[useTwitchWs] Screen changed:', {
      from: lastScreenRef.current,
      to: currentScreen,
      isOnChatScreen,
      wasOnChatScreen,
    });

    if (wasOnChatScreen && !isOnChatScreen) {
      logger.twitchWs.info(
        '[useTwitchWs] Left chat/livestream screen, disconnecting WS',
      );
      clearKeepaliveTimer();
      void cleanupSubscriptions();
    } else if (!wasOnChatScreen && isOnChatScreen) {
      logger.twitchWs.info(
        '[useTwitchWs] Entered chat/livestream screen, ensuring WS connection',
      );
      hasInitialized.current = true;
    }

    lastScreenRef.current = currentScreen;
  }, [currentScreen, shouldConnect, clearKeepaliveTimer, cleanupSubscriptions]);

  useEffect(() => {
    return () => {
      logger.twitchWs.info('[useTwitchWs] Cleaning up Twitch WS client');
      clearKeepaliveTimer();
      void cleanupSubscriptions();
    };
  }, [clearKeepaliveTimer, cleanupSubscriptions]);

  return getWebSocket();
}
