import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import {
  CosmeticCreate,
  EntitlementCreate,
  SevenTvEventData,
  SevenTvEventType,
  SevenTvWsMessage,
} from '@app/services/ws/seventv-ws-service';
import { logger } from '@app/utils/logger';
import { useNavigationState } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { getActiveRouteName } from '../navigators/navigationUtilities';
import { useWebsocket } from './ws/useWebsocket';

export const SEVENTV_CHAT_SCREENS = ['Chat', 'LiveStream'];

// Re-export types for consumers of this hook
export type {
  SevenTvEventData,
  SevenTvEventType,
  CosmeticCreate,
  EntitlementCreate,
};

interface EmoteUpdateCallbackData {
  added: SanitisiedEmoteSet[];
  removed: SanitisiedEmoteSet[];
  channelId: string;
}

export interface CosmeticCreateCallbackData {
  cosmetic: CosmeticCreate;
  kind: 'PAINT' | 'BADGE';
}

export interface EntitlementCreateCallbackData {
  entitlement: EntitlementCreate;
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
  /** The Twitch user ID (from user.connections) */
  ttvUserId: string | null;
  /** The user's active paint ID (from user.style.paint_id) */
  paintId: string | null;
  /** The user's active badge ID (from user.style.badge_id) */
  badgeId: string | null;
}

interface UseSeventvWsOptions {
  onEmoteUpdate?: (data: EmoteUpdateCallbackData) => void;
  onCosmeticCreate?: (data: CosmeticCreateCallbackData) => void;
  onEntitlementCreate?: (data: EntitlementCreateCallbackData) => void;
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
const HISTORICAL_EVENT_BUFFER = 10000; // 10 seconds

export function useSeventvWs(
  options?: UseSeventvWsOptions,
): UseSeventvWsReturn {
  const hasInitialized = useRef(false);
  const lastScreenRef = useRef<string | null>(null);
  const emoteCallbackRef = useRef(options?.onEmoteUpdate);
  const cosmeticCallbackRef = useRef(options?.onCosmeticCreate);
  const entitlementCallbackRef = useRef(options?.onEntitlementCreate);
  const eventCallbackRef = useRef(options?.onEvent);
  const connectionTimestampRef = useRef<number | null>(null);

  const twitchChannelIdRef = useRef(options?.twitchChannelId);
  const sevenTvEmoteSetIdRef = useRef(options?.sevenTvEmoteSetId);

  const currentEmoteSetIdRef = useRef<string | undefined>(undefined);
  const activeSubscriptionsRef = useRef<Set<string>>(new Set());
  const hasInitialSubscriptionsRef = useRef<boolean>(false);

  emoteCallbackRef.current = options?.onEmoteUpdate;
  cosmeticCallbackRef.current = options?.onCosmeticCreate;
  entitlementCallbackRef.current = options?.onEntitlementCreate;
  eventCallbackRef.current = options?.onEvent;
  twitchChannelIdRef.current = options?.twitchChannelId;
  sevenTvEmoteSetIdRef.current = options?.sevenTvEmoteSetId;

  const currentScreen = useNavigationState(state => {
    if (!state) return null;
    return getActiveRouteName(state);
  });

  const shouldConnect = useMemo(() => {
    if (!currentScreen) return false;
    const isOnChatScreen = SEVENTV_CHAT_SCREENS.includes(currentScreen);
    const hasRequiredIds =
      twitchChannelIdRef.current && sevenTvEmoteSetIdRef.current;
    return isOnChatScreen && hasRequiredIds;
  }, [currentScreen]);

  const handleEmoteSetUpdate = useCallback(
    (data: SevenTvEventData<'emote_set.update'>) => {
      try {
        // Filter out historical events
        if (connectionTimestampRef.current) {
          const timeSinceConnection =
            Date.now() - connectionTimestampRef.current;

          if (timeSinceConnection < HISTORICAL_EVENT_BUFFER) {
            logger.stvWs.info(
              '💚 Ignoring potential historical emote set update event (within buffer period)',
            );
            return;
          }
        }

        const addedEmotes: SanitisiedEmoteSet[] = [];
        const removedEmotes: SanitisiedEmoteSet[] = [];
        const { body } = data;

        if (body.pushed) {
          body.pushed.forEach(emote => {
            const emoteUrl =
              emote.value.data.host.files.find(
                file => file.name === '4x.avif',
              ) ||
              emote.value.data.host.files.find(
                file => file.name === '3x.avif',
              ) ||
              emote.value.data.host.files.find(
                file => file.name === '2x.avif',
              ) ||
              emote.value.data.host.files.find(file => file.name === '1x.avif');

            addedEmotes.push({
              name: emote.value.name,
              id: emote.value.id,
              url: `https://cdn.7tv.app/emote/${emote.value.id}/${emoteUrl?.name ?? '1x.avif'}`,
              flags: emote.value.data.flags,
              original_name: emote.value.data.name,
              creator:
                (emote.value.data.owner?.display_name ||
                  emote.value.data.owner?.username) ??
                'UNKNOWN',
              emote_link: `https://7tv.app/emotes/${emote.value.id}`,
              site: '7TV Channel Emote',
              height: emoteUrl?.height,
              width: emoteUrl?.width,
              actor: body.actor,
            });
          });
        }

        if (body.pulled) {
          body.pulled.forEach(emote => {
            if (emote && emote.old_value) {
              removedEmotes.push({
                name: emote.old_value.data.name,
                id: emote.old_value.id,
                url: `https://cdn.7tv.app/emote/${emote.old_value.id}/1x.avif`,
                flags: 0,
                original_name: emote.old_value.data.name,
                creator: emote.old_value.data.owner?.display_name,
                emote_link: `https://7tv.app/emotes/${emote.old_value.id}`,
                site: '7TV Channel Emote',
                actor: body.actor,
              });
            }
          });
        }

        if (addedEmotes.length > 0 || removedEmotes.length > 0) {
          logger.stvWs.info(
            `💚 Processing emote set update: +${addedEmotes.length} -${removedEmotes.length} emotes`,
          );

          if (emoteCallbackRef.current) {
            emoteCallbackRef.current({
              added: addedEmotes,
              removed: removedEmotes,
              channelId: twitchChannelIdRef.current || '',
            });
          }
        }
      } catch (error) {
        logger.stvWs.error('Error handling emote set update:', error);
      }
    },
    [],
  );

  const handleCosmeticCreate = useCallback(
    (data: SevenTvEventData<'cosmetic.create'>) => {
      try {
        const cosmeticKind = data.body.object.kind;

        if (cosmeticKind === 'PAINT' || cosmeticKind === 'BADGE') {
          if (cosmeticCallbackRef.current) {
            cosmeticCallbackRef.current({
              cosmetic: data.body,
              kind: cosmeticKind,
            });
          }
        }
      } catch (e) {
        logger.chat.error('Error handling cosmetic.create:', e);
      }
    },
    [],
  );

  const handleEntitlementCreate = useCallback(
    (data: SevenTvEventData<'entitlement.create'>) => {
      try {
        const { body } = data;
        const { object } = body;
        const { kind: entitlementKind, user } = object;

        let ttvUserId: string | null = null;
        if (user.connections) {
          for (let i = 0; i < user.connections.length; i += 1) {
            const conn = user.connections[i];
            if (conn?.platform === 'TWITCH') {
              ttvUserId = conn.id;
              break;
            }
          }
        }

        const paintId = user.style?.paint_id ?? null;
        const badgeId = user.style?.badge_id ?? null;

        logger.stvWs.info(
          `Entitlement create: ${entitlementKind} for user ${user.display_name} (ttv: ${ttvUserId}, paint: ${paintId}, badge: ${badgeId})`,
        );

        if (entitlementCallbackRef.current) {
          entitlementCallbackRef.current({
            entitlement: body,
            kind: entitlementKind,
            ttvUserId,
            paintId,
            badgeId,
          });
        }
      } catch (e) {
        logger.chat.error('Error handling entitlement.create:', e);
      }
    },
    [],
  );

  const sendSubscription = useCallback(
    (emoteSetId: string, sendJsonMessage: (msg: unknown) => void) => {
      logger.stvWs.info(
        `💚 Attempting to subscribe to emote set: ${emoteSetId}`,
      );

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
    },
    [],
  );

  const setupInitialSubscriptions = useCallback(
    async (sendJsonMessage: (msg: unknown) => void) => {
      let waitStartTime = Date.now();

      // Wait for twitchChannelId
      while (
        !twitchChannelIdRef.current &&
        Date.now() - waitStartTime < ID_WAIT_TIMEOUT
      ) {
        logger.stvWs.debug('💚 Waiting for twitchChannelId to be set...');
        // eslint-disable-next-line no-await-in-loop
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

        const subscribeCosmeticMessage: SevenTvWsMessage<
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
        sendJsonMessage(subscribeCosmeticMessage);
        logger.stvWs.info(
          '💚 Subscribed to entitlement.create and cosmetic.create events',
        );
      }

      waitStartTime = Date.now();

      // Wait for sevenTVemoteSetId
      while (
        !sevenTvEmoteSetIdRef.current &&
        Date.now() - waitStartTime < ID_WAIT_TIMEOUT
      ) {
        logger.stvWs.debug('💚 Waiting for sevenTVemoteSetId to be set...');
        // eslint-disable-next-line no-await-in-loop
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
    },
    [],
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
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
                logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);
                handleEmoteSetUpdate(
                  message.d as SevenTvEventData<'emote_set.update'>,
                );
                break;
              }

              case 'cosmetic.create': {
                handleCosmeticCreate(
                  message.d as SevenTvEventData<'cosmetic.create'>,
                );
                break;
              }

              case 'entitlement.create': {
                logger.stvWs.info(`💚 Received WS 'entitlement.create' event`);
                handleEntitlementCreate(
                  message.d as SevenTvEventData<'entitlement.create'>,
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
              `💚 Received invalid subscription condition: ${JSON.stringify(message.d)}`,
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
        logger.stvWs.error(
          `Failed to parse STV message ${JSON.stringify(e, null, 2)}`,
        );
      }
    },
    [handleEmoteSetUpdate, handleCosmeticCreate, handleEntitlementCreate],
  );

  const { getWebSocket, sendJsonMessage } = useWebsocket(
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

        logger.stvWs.info('💚 SevenTV WebSocket setup complete');
      },
      onMessage: (event: MessageEvent) => {
        handleMessage(event);
      },
      onClose: (event: CloseEvent) => {
        logger.stvWs.warn(
          `🟢 SevenTV WebSocket closed: ${event.code} - ${event.reason}`,
        );
        hasInitialSubscriptionsRef.current = false;
      },
      onError: (error: Event) => {
        logger.stvWs.error(
          `💚 SevenTv WS error: ${JSON.stringify(error, null, 2)}`,
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

  const subscribeToChannel = useCallback(
    (emoteSetId: string) => {
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

      // Unsubscribe from previous channel if different
      if (
        currentEmoteSetIdRef.current &&
        currentEmoteSetIdRef.current !== emoteSetId &&
        ws.readyState === WebSocket.OPEN
      ) {
        const unsubscribeMessage: SevenTvWsMessage<never, 'emote_set.update'> =
          {
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
    },
    [getWebSocket, sendJsonMessage, sendSubscription],
  );

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
  }, [getWebSocket, sendJsonMessage]);

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
    if (!currentScreen) return;

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
      unsubscribeFromChannel();
      hasInitialized.current = false;
      connectionTimestampRef.current = null;
      activeSubscriptionsRef.current.clear();
      currentEmoteSetIdRef.current = undefined;
    }

    lastScreenRef.current = currentScreen;
  }, [currentScreen, unsubscribeFromChannel]);

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

    // Track when we're on chat screen with required IDs
    if (isOnChatScreen && hasRequiredIds && !hasInitialized.current) {
      logger.stvWs.info(
        '[useSeventvWs] All requirements met, SevenTV WS will connect',
      );
      connectionTimestampRef.current = Date.now();
      hasInitialized.current = true;
    }
  }, [currentScreen]);

  useEffect(() => {
    return () => {
      logger.stvWs.info('[useSeventvWs] Cleaning up SevenTV WS client');
      unsubscribeFromChannel();
      connectionTimestampRef.current = null;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      activeSubscriptionsRef.current.clear();
      currentEmoteSetIdRef.current = undefined;
    };
  }, [unsubscribeFromChannel]);

  return {
    ws: getWebSocket(),
    subscribeToChannel,
    unsubscribeFromChannel,
    isConnected,
    getConnectionState:
      getConnectionState as unknown as UseSeventvWsReturn['getConnectionState'],
  };
}
