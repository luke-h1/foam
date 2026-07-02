import { useCallback, useEffect, useRef } from 'react';

import { usePathname } from 'expo-router';

import { useLazyRef } from '@app/hooks/useLazyRef';
import { useSyncRef } from '@app/hooks/useSyncRef';
import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import {
  CosmeticCreate,
  type CosmeticCreateCallbackData,
  type CosmeticDeleteCallbackData,
  type CosmeticUpdateCallbackData,
  EntitlementCreate,
  type EntitlementCreateCallbackData,
  type EntitlementDeleteCallbackData,
  type EntitlementUpdateCallbackData,
  SevenTvEventData,
  SevenTvEventType,
  SevenTvWsMessage,
} from '@app/types/seventv/cosmetics';
import { logger } from '@app/utils/logger';

import {
  type CosmeticSyncDeps,
  handleCosmeticCreate,
  handleCosmeticDelete,
  handleCosmeticUpdate,
  handleEntitlementCreate,
  handleEntitlementDelete,
  handleEntitlementUpdate,
} from './seventv/cosmeticSync';
import {
  type EmoteSyncDeps,
  type EmoteUpdateCallbackData,
  handleEmoteSetUpdate,
  isActiveEmoteSetUpdate,
} from './seventv/emoteSync';
import { ReadyState } from './ws/constants';
import { useWebsocket } from './ws/useWebsocket';

const SEVENTV_CHAT_SCREENS = ['Chat', 'LiveStream'];

export type {
  CosmeticCreate,
  CosmeticCreateCallbackData,
  CosmeticDeleteCallbackData,
  CosmeticUpdateCallbackData,
  EntitlementCreate,
  EntitlementCreateCallbackData,
  EntitlementDeleteCallbackData,
  EntitlementUpdateCallbackData,
  SevenTvEventData,
  SevenTvEventType,
};

interface UseSeventvWsOptions {
  onEmoteUpdate?: (data: EmoteUpdateCallbackData) => void;
  onCosmeticCreate?: (data: CosmeticCreateCallbackData) => void;
  onCosmeticUpdate?: (data: CosmeticUpdateCallbackData) => void;
  onCosmeticDelete?: (data: CosmeticDeleteCallbackData) => void;
  onEntitlementCreate?: (data: EntitlementCreateCallbackData) => void;
  onEntitlementUpdate?: (data: EntitlementUpdateCallbackData) => void;
  onEntitlementDelete?: (data: EntitlementDeleteCallbackData) => void;
  onEvent?: (
    eventType: SevenTvEventType,
    data: SevenTvEventData<SevenTvEventType>,
  ) => void;
  twitchChannelId?: string;
  sevenTvEmoteSetId?: string;
}

type UseSeventvWsReturn = {
  ws: WebSocket;
  subscribeToChannel: (channelId: string) => void;
  unsubscribeFromChannel: () => void;
  isConnected: () => boolean;
  readyState: ReadyState;
  getConnectionState: () =>
    | 'DISCONNECTED'
    | 'CONNECTING'
    | 'CONNECTED'
    | 'CLOSING'
    | 'CLOSED'
    | 'UNKNOWN';
};

const DEFAULT_URL = 'wss://events.7tv.io/v3';
const ID_WAIT_TIMEOUT = 30000; // 30 seconds

function getSevenTvChatScreenFromPathname(pathname: string | null) {
  if (!pathname) {
    return null;
  }
  if (pathname === '/chat') {
    return 'Chat';
  }
  if (pathname.startsWith('/streams/live-stream/')) {
    return 'LiveStream';
  }
  return null;
}

export function useSeventvWs(
  options?: UseSeventvWsOptions,
): UseSeventvWsReturn {
  const hasInitialized = useRef(false);
  const lastScreenRef = useRef<string | null>(null);
  const emoteCallbackRef = useRef(options?.onEmoteUpdate);
  const cosmeticCallbackRef = useRef(options?.onCosmeticCreate);
  const cosmeticUpdateCallbackRef = useRef(options?.onCosmeticUpdate);
  const cosmeticDeleteCallbackRef = useRef(options?.onCosmeticDelete);
  const entitlementCallbackRef = useRef(options?.onEntitlementCreate);
  const entitlementUpdateCallbackRef = useRef(options?.onEntitlementUpdate);
  const entitlementDeleteCallbackRef = useRef(options?.onEntitlementDelete);
  const eventCallbackRef = useRef(options?.onEvent);
  const connectionTimestampRef = useRef<number | null>(null);
  const pathname = usePathname();

  const twitchChannelIdRef = useRef<string | undefined>(undefined);
  const sevenTvEmoteSetIdRef = useRef<string | undefined>(undefined);

  const currentEmoteSetIdRef = useRef<string | undefined>(undefined);
  const activeSubscriptionsRef = useLazyRef(() => new Set<string>());
  const hasInitialSubscriptionsRef = useRef<boolean>(false);

  emoteCallbackRef.current = options?.onEmoteUpdate;
  cosmeticCallbackRef.current = options?.onCosmeticCreate;
  cosmeticUpdateCallbackRef.current = options?.onCosmeticUpdate;
  cosmeticDeleteCallbackRef.current = options?.onCosmeticDelete;
  entitlementCallbackRef.current = options?.onEntitlementCreate;
  entitlementUpdateCallbackRef.current = options?.onEntitlementUpdate;
  entitlementDeleteCallbackRef.current = options?.onEntitlementDelete;
  eventCallbackRef.current = options?.onEvent;
  twitchChannelIdRef.current = options?.twitchChannelId;
  sevenTvEmoteSetIdRef.current = options?.sevenTvEmoteSetId;

  const currentScreen = getSevenTvChatScreenFromPathname(pathname);

  const shouldConnect = (() => {
    if (!currentScreen) {
      return false;
    }
    const isOnChatScreen = SEVENTV_CHAT_SCREENS.includes(currentScreen);
    const hasRequiredIds =
      options?.twitchChannelId && options?.sevenTvEmoteSetId;
    return isOnChatScreen && hasRequiredIds;
  })();

  const getEmoteSyncDeps = (): EmoteSyncDeps => ({
    expectedEmoteSetId:
      sevenTvEmoteSetIdRef.current || currentEmoteSetIdRef.current,
    connectionTimestamp: connectionTimestampRef.current,
    channelId: twitchChannelIdRef.current,
    onEmoteUpdate: emoteCallbackRef.current,
  });

  const getCosmeticSyncDeps = (): CosmeticSyncDeps => ({
    onCosmeticCreate: cosmeticCallbackRef.current,
    onCosmeticUpdate: cosmeticUpdateCallbackRef.current,
    onCosmeticDelete: cosmeticDeleteCallbackRef.current,
    onEntitlementCreate: entitlementCallbackRef.current,
    onEntitlementUpdate: entitlementUpdateCallbackRef.current,
    onEntitlementDelete: entitlementDeleteCallbackRef.current,
  });

  const sendSubscription = (
    emoteSetId: string,
    sendJsonMessage: (msg: unknown) => void,
  ) => {
    logger.stvWs.info(`💚 Attempting to subscribe to emote set: ${emoteSetId}`);

    if (twitchChannelIdRef.current) {
      const entitlementSubscriptionMessage: SevenTvWsMessage<
        never,
        'entitlement.create'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'entitlement.create',
          condition: {
            id: twitchChannelIdRef.current,
            platform: 'TWITCH',
            ctx: 'channel',
          },
        },
      };

      sendJsonMessage(entitlementSubscriptionMessage);
    }

    const emoteSetSubscriptionMessage: SevenTvWsMessage<
      never,
      'emote_set.update'
    > = {
      op: 35,
      d: {
        type: 'emote_set.update',
        condition: {
          object_id: emoteSetId,
        },
      },
    };

    sendJsonMessage(emoteSetSubscriptionMessage);

    logger.stvWs.info(
      `✅ Successfully sent subscription for emote set: ${emoteSetId}`,
    );
  };

  const setupInitialSubscriptions = async (
    sendJsonMessage: (msg: unknown) => void,
  ) => {
    let waitStartTime = Date.now();

    while (
      !twitchChannelIdRef.current &&
      Date.now() - waitStartTime < ID_WAIT_TIMEOUT
    ) {
      logger.stvWs.debug('💚 Waiting for twitchChannelId to be set...');
      // eslint-disable-next-line react-doctor/async-await-in-loop -- poll until channel id is available
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });
    }

    if (twitchChannelIdRef.current) {
      const subscribeEntitlementMessage: SevenTvWsMessage<
        never,
        'entitlement.create'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'entitlement.create',
          condition: {
            platform: 'TWITCH',
            ctx: 'channel',
            id: twitchChannelIdRef.current,
          },
        },
      };

      const subscribeCosmeticCreateMessage: SevenTvWsMessage<
        never,
        'cosmetic.create'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'cosmetic.create',
          condition: {
            platform: 'TWITCH',
            ctx: 'channel',
            id: twitchChannelIdRef.current,
          },
        },
      };

      sendJsonMessage(subscribeEntitlementMessage);
      sendJsonMessage(subscribeCosmeticCreateMessage);
      logger.stvWs.info(
        '💚 Subscribed to entitlement.create and cosmetic.create events',
      );
      logger.stvWs.info(
        '💚 Note: update/delete events will be handled through general event stream',
      );
    }

    waitStartTime = Date.now();

    while (
      !sevenTvEmoteSetIdRef.current &&
      Date.now() - waitStartTime < ID_WAIT_TIMEOUT
    ) {
      logger.stvWs.debug('💚 Waiting for sevenTVemoteSetId to be set...');
      // eslint-disable-next-line react-doctor/async-await-in-loop -- poll until emote set id is available
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });
    }

    if (sevenTvEmoteSetIdRef.current) {
      const subscribeEmoteSetMessage: SevenTvWsMessage<
        never,
        'emote_set.update'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'emote_set.update',
          condition: {
            object_id: sevenTvEmoteSetIdRef.current,
          },
        },
      };

      sendJsonMessage(subscribeEmoteSetMessage);
      logger.stvWs.info('💚 Subscribed to emote_set.update events');
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data as string) as SevenTvWsMessage<
        SevenTvEventData<SevenTvEventType>
      >;

      logger.stvWs.debug('[handleMessage] op:', message.op);

      switch (message.op) {
        case 0: {
          if (!message.d) {
            logger.stvWs.error('message.d is undefined or null');
            break;
          }

          if (typeof message.d !== 'object' || !('type' in message.d)) {
            logger.stvWs.error('message.d does not have expected structure');
            break;
          }

          switch (message.d.type) {
            case 'emote_set.update': {
              const data = message.d as SevenTvEventData<'emote_set.update'>;
              const deps = getEmoteSyncDeps();

              if (isActiveEmoteSetUpdate(data, deps.expectedEmoteSetId)) {
                logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);
                handleEmoteSetUpdate(data, deps);
              }
              break;
            }

            case 'cosmetic.create': {
              handleCosmeticCreate(
                message.d as SevenTvEventData<'cosmetic.create'>,
                getCosmeticSyncDeps(),
              );
              break;
            }

            case 'entitlement.create': {
              logger.stvWs.info(`💚 Received WS 'entitlement.create' event`);
              handleEntitlementCreate(
                message.d as SevenTvEventData<'entitlement.create'>,
                getCosmeticSyncDeps(),
              );
              break;
            }

            case 'cosmetic.update': {
              logger.stvWs.info(`💚 Received WS 'cosmetic.update' event`);
              handleCosmeticUpdate(
                message.d as SevenTvEventData<'cosmetic.update'>,
                getCosmeticSyncDeps(),
              );
              break;
            }

            case 'cosmetic.delete': {
              logger.stvWs.info(`💚 Received WS 'cosmetic.delete' event`);
              handleCosmeticDelete(
                message.d as SevenTvEventData<'cosmetic.delete'>,
                getCosmeticSyncDeps(),
              );
              break;
            }

            case 'entitlement.update': {
              logger.stvWs.info(`💚 Received WS 'entitlement.update' event`);
              handleEntitlementUpdate(
                message.d as SevenTvEventData<'entitlement.update'>,
                getCosmeticSyncDeps(),
              );
              break;
            }

            case 'entitlement.delete': {
              logger.stvWs.info(`💚 Received WS 'entitlement.delete' event`);
              handleEntitlementDelete(
                message.d as SevenTvEventData<'entitlement.delete'>,
                getCosmeticSyncDeps(),
              );
              break;
            }

            default: {
              logger.stvWs.debug(
                `[DEFAULT CASE] Unhandled event type: ${message.d.type}`,
              );
              break;
            }
          }

          if (eventCallbackRef.current) {
            eventCallbackRef.current(message.d.type, message.d);
          }
          break;
        }

        case 2: {
          logger.stvWs.info(
            `💚 Received WS heartbeat event. Total received: ${message.d.count}`,
          );
          break;
        }

        case 5: {
          logger.stvWs.info(`💚 Received WS ACK event: ${message.d.command}`);
          break;
        }

        case 1: {
          logger.stvWs.info(`💚 Received WS hello/ACK event`);
          break;
        }

        case 6: {
          logger.stvWs.warn(
            `💚 Received invalid subscription condition: ${JSON.stringify(
              message.d,
            )}`,
            {
              name: 'seven_tv_ws_warning',
              action: 'invalid_subscription_condition',
              channel_id: twitchChannelIdRef.current,
              provider: 'seven_tv',
              screen: currentScreen,
              seven_tv_emote_set_id: sevenTvEmoteSetIdRef.current,
            },
          );
          break;
        }

        case 7: {
          logger.stvWs.info(`💚 Received server req connection`);
          break;
        }

        default: {
          logger.stvWs.debug(`Unhandled op code ${message.op}`);
        }
      }
    } catch (e) {
      logger.stvWs.warn(
        `Failed to parse STV message ${JSON.stringify(e, null, 2)}`,
        {
          name: 'seven_tv_ws_warning',
          error: e,
          action: 'message_parse_failed',
          channel_id: twitchChannelIdRef.current,
          provider: 'seven_tv',
          screen: currentScreen,
          seven_tv_emote_set_id: sevenTvEmoteSetIdRef.current,
        },
      );
    }
  };

  const { getWebSocket, sendJsonMessage, readyState } = useWebsocket(
    shouldConnect ? DEFAULT_URL : null,
    {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onOpen: async () => {
        logger.stvWs.info('💚 SevenTV WebSocket connected');
        connectionTimestampRef.current = Date.now();

        if (!hasInitialSubscriptionsRef.current) {
          await setupInitialSubscriptions(sendJsonMessage);
          hasInitialSubscriptionsRef.current = true;
        }

        logger.stvWs.info('💚 SevenTV WebSocket setup complete', {
          name: 'seven_tv_ws_info',
          action: 'connected',
          channel_id: twitchChannelIdRef.current,
          provider: 'seven_tv',
          screen: currentScreen,
          seven_tv_emote_set_id: sevenTvEmoteSetIdRef.current,
        });
      },
      onMessage: (event: MessageEvent) => {
        handleMessage(event);
      },
      onClose: (event: CloseEvent) => {
        logger.stvWs.warn(
          `🟢 SevenTV WebSocket closed: ${event.code} - ${event.reason}`,
        );
        if (event.code !== 1000) {
          logger.stvWs.warn('7TV WebSocket closed unexpectedly', {
            name: 'seven_tv_ws_warning',
            action: 'closed',
            channel_id: twitchChannelIdRef.current,
            code: event.code,
            provider: 'seven_tv',
            reason: event.reason,
            screen: currentScreen,
            seven_tv_emote_set_id: sevenTvEmoteSetIdRef.current,
          });
        }
        hasInitialSubscriptionsRef.current = false;
      },
      onError: (error: Event) => {
        logger.stvWs.warn(
          `💚 SevenTv WS error: ${JSON.stringify(error, null, 2)}`,
          {
            name: 'seven_tv_ws_warning',
            error,
            action: 'error',
            channel_id: twitchChannelIdRef.current,
            provider: 'seven_tv',
            screen: currentScreen,
            seven_tv_emote_set_id: sevenTvEmoteSetIdRef.current,
          },
        );
      },
      shouldReconnect: (event: CloseEvent) => {
        return !!(shouldConnect && event.code !== 1000);
      },
      reconnectAttempts: 5,
      reconnectInterval: 1000,
    },
    !!shouldConnect,
  );

  const subscribeToChannel = (emoteSetId: string) => {
    const ws = getWebSocket();

    if (!ws) {
      logger.stvWs.warn(
        `💚 Cannot subscribe to emote set ${emoteSetId}: WebSocket not available`,
      );
      return;
    }

    if (activeSubscriptionsRef.current.has(emoteSetId)) {
      logger.stvWs.info(`💚 Already subscribed to emote set: ${emoteSetId}`);
      return;
    }

    if (
      currentEmoteSetIdRef.current &&
      currentEmoteSetIdRef.current !== emoteSetId &&
      ws.readyState === WebSocket.OPEN
    ) {
      const unsubscribeMessage: SevenTvWsMessage<never, 'emote_set.update'> = {
        op: 36,
        d: {
          type: 'emote_set.update',
          condition: {
            object_id: currentEmoteSetIdRef.current,
          },
        },
      };

      sendJsonMessage(unsubscribeMessage);
      activeSubscriptionsRef.current.delete(currentEmoteSetIdRef.current);
    }

    currentEmoteSetIdRef.current = emoteSetId;

    if (ws.readyState === WebSocket.OPEN && emoteSetId) {
      sendSubscription(emoteSetId, sendJsonMessage);
      activeSubscriptionsRef.current.add(emoteSetId);
    }

    logger.stvWs.info(`💚 Set current emote set: ${emoteSetId}`);
  };

  const unsubscribeFromChannel = useCallback(() => {
    const ws = getWebSocket();

    if (
      ws &&
      currentEmoteSetIdRef.current &&
      ws.readyState === WebSocket.OPEN
    ) {
      const unsubscribeMessage: SevenTvWsMessage<never, 'emote_set.update'> = {
        op: 36,
        d: {
          type: 'emote_set.update',
          condition: {
            object_id: currentEmoteSetIdRef.current,
          },
        },
      };

      sendJsonMessage(unsubscribeMessage);
      activeSubscriptionsRef.current.delete(currentEmoteSetIdRef.current);
    }

    currentEmoteSetIdRef.current = undefined;
    logger.stvWs.info('💚 Cleared current emote set');
  }, [activeSubscriptionsRef, getWebSocket, sendJsonMessage]);

  const unsubscribeFromChannelRef = useSyncRef(unsubscribeFromChannel);

  const isConnected = useCallback(() => {
    const ws = getWebSocket();
    return ws !== null && ws.readyState === WebSocket.OPEN;
  }, [getWebSocket]);

  const getConnectionState = useCallback((): ReturnType<
    UseSeventvWsReturn['getConnectionState']
  > => {
    const ws = getWebSocket();

    if (!ws) {
      return 'DISCONNECTED';
    }

    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }, [getWebSocket]);

  useEffect(() => {
    if (!currentScreen) {
      return;
    }

    const isOnChatScreen = SEVENTV_CHAT_SCREENS.includes(currentScreen);
    const wasOnChatScreen = lastScreenRef.current
      ? SEVENTV_CHAT_SCREENS.includes(lastScreenRef.current)
      : false;

    logger.stvWs.info('[useSeventvWs] Screen changed:', {
      from: lastScreenRef.current,
      to: currentScreen,
      isOnChatScreen,
      wasOnChatScreen,
    });

    if (wasOnChatScreen && !isOnChatScreen) {
      logger.stvWs.info(
        '[useSeventvWs] Left chat/livestream screen, unsubscribing and disconnecting SevenTV WS',
      );
      unsubscribeFromChannelRef.current();
      hasInitialized.current = false;
      connectionTimestampRef.current = null;
      activeSubscriptionsRef.current.clear();
      currentEmoteSetIdRef.current = undefined;
    }

    lastScreenRef.current = currentScreen;
  }, [activeSubscriptionsRef, currentScreen, unsubscribeFromChannelRef]);

  useEffect(() => {
    if (!currentScreen) {
      return;
    }

    const isOnChatScreen = SEVENTV_CHAT_SCREENS.includes(currentScreen);
    const hasRequiredIds =
      twitchChannelIdRef.current && sevenTvEmoteSetIdRef.current;

    logger.stvWs.info('[useSeventvWs] Checking connection requirements:', {
      isOnChatScreen,
      hasTwitchChannelId: !!twitchChannelIdRef.current,
      hasSevenTvEmoteSetId: !!sevenTvEmoteSetIdRef.current,
      hasRequiredIds,
      shouldConnect: isOnChatScreen && hasRequiredIds,
    });

    if (isOnChatScreen && hasRequiredIds && !hasInitialized.current) {
      logger.stvWs.info(
        '[useSeventvWs] All requirements met, SevenTV WS will connect',
      );
      connectionTimestampRef.current = Date.now();
      hasInitialized.current = true;
    }
  }, [currentScreen]);

  useUnmountCallback(() => {
    logger.stvWs.info('[useSeventvWs] Cleaning up SevenTV WS client');
    unsubscribeFromChannelRef.current();
    connectionTimestampRef.current = null;
    activeSubscriptionsRef.current.clear();
    currentEmoteSetIdRef.current = undefined;
  });

  return {
    ws: getWebSocket(),
    subscribeToChannel,
    unsubscribeFromChannel,
    isConnected,
    readyState,
    getConnectionState: getConnectionState,
  };
}
