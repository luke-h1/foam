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
  buildCosmeticCreateSubscribeMessage,
  buildEmoteSetUpdateSubscribeMessage,
  buildEmoteSetUpdateUnsubscribeMessage,
  buildEntitlementCreateSubscribeMessage,
  type EmoteUpdateCallbackData,
  type HandledSevenTvEventType,
  interpretSeventvWsMessage,
  type SeventvWsDecision,
} from '@app/utils/seventv/seventvWsInterpreter';

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

function logEventHandlerError(
  eventType: HandledSevenTvEventType,
  error: unknown,
) {
  if (eventType === 'emote_set.update') {
    logger.stvWs.error('Error handling emote set update:', error);
  } else {
    logger.chat.error(`Error handling ${eventType}:`, error);
  }
}

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

  const sendSubscription = (
    emoteSetId: string,
    sendJsonMessage: (msg: unknown) => void,
  ) => {
    logger.stvWs.info(`💚 Attempting to subscribe to emote set: ${emoteSetId}`);

    if (twitchChannelIdRef.current) {
      sendJsonMessage(
        buildEntitlementCreateSubscribeMessage(
          twitchChannelIdRef.current,
          Date.now(),
        ),
      );
    }

    sendJsonMessage(buildEmoteSetUpdateSubscribeMessage(emoteSetId));

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
      sendJsonMessage(
        buildEntitlementCreateSubscribeMessage(
          twitchChannelIdRef.current,
          Date.now(),
        ),
      );
      sendJsonMessage(
        buildCosmeticCreateSubscribeMessage(
          twitchChannelIdRef.current,
          Date.now(),
        ),
      );
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
      sendJsonMessage(
        buildEmoteSetUpdateSubscribeMessage(
          sevenTvEmoteSetIdRef.current,
          Date.now(),
        ),
      );
      logger.stvWs.info('💚 Subscribed to emote_set.update events');
    }
  };

  const executeDecision = (decision: SeventvWsDecision) => {
    switch (decision.type) {
      case 'applyEmoteUpdate': {
        logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);
        logger.stvWs.info(
          `💚 Processing emote set update: +${decision.added.length} -${decision.removed.length} emotes`,
        );
        try {
          emoteCallbackRef.current?.({
            added: decision.added,
            removed: decision.removed,
            channelId: decision.channelId,
          });
        } catch (error) {
          logEventHandlerError('emote_set.update', error);
        }
        break;
      }

      case 'ignoreEmoteSetUpdate': {
        if (decision.reason === 'differentEmoteSet') {
          logger.stvWs.debug(
            `Ignoring 7TV emote_set.update for ${decision.receivedEmoteSetId}; active set is ${decision.expectedEmoteSetId}`,
          );
        } else if (decision.reason === 'historicalEvent') {
          logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);
          logger.stvWs.info(
            '💚 Ignoring potential historical emote set update event (within buffer period)',
          );
        } else if (decision.reason === 'noChanges') {
          logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);
        }
        break;
      }

      case 'applyCosmeticCreate': {
        try {
          cosmeticCallbackRef.current?.({
            cosmetic: decision.cosmetic,
            kind: decision.kind,
          });
        } catch (error) {
          logEventHandlerError('cosmetic.create', error);
        }
        break;
      }

      case 'ignoreCosmeticCreate': {
        break;
      }

      case 'applyEntitlementCreate': {
        logger.stvWs.info(`💚 Received WS 'entitlement.create' event`);
        logger.stvWs.info(
          `Entitlement create: ${decision.kind} for user ${decision.userDisplayName} (ttv: ${decision.ttvUserId}, paint: ${decision.paintId}, badge: ${decision.badgeId})`,
        );
        try {
          entitlementCallbackRef.current?.({
            entitlement: decision.entitlement,
            kind: decision.kind,
            ttvUserId: decision.ttvUserId,
            paintId: decision.paintId,
            badgeId: decision.badgeId,
          });
        } catch (error) {
          logEventHandlerError('entitlement.create', error);
        }
        break;
      }

      case 'applyCosmeticUpdate': {
        logger.stvWs.info(`💚 Received WS 'cosmetic.update' event`);
        try {
          cosmeticUpdateCallbackRef.current?.({
            changes: decision.changes,
            kind: decision.kind,
          });
        } catch (error) {
          logEventHandlerError('cosmetic.update', error);
        }
        break;
      }

      case 'applyCosmeticDelete': {
        logger.stvWs.info(`💚 Received WS 'cosmetic.delete' event`);
        try {
          cosmeticDeleteCallbackRef.current?.({
            cosmeticId: decision.cosmeticId,
          });
        } catch (error) {
          logEventHandlerError('cosmetic.delete', error);
        }
        break;
      }

      case 'applyEntitlementUpdate': {
        logger.stvWs.info(`💚 Received WS 'entitlement.update' event`);
        try {
          entitlementUpdateCallbackRef.current?.({
            changes: decision.changes,
            ttvUserId: decision.ttvUserId,
            paintId: decision.paintId,
            badgeId: decision.badgeId,
          });
        } catch (error) {
          logEventHandlerError('entitlement.update', error);
        }
        break;
      }

      case 'applyEntitlementDelete': {
        logger.stvWs.info(`💚 Received WS 'entitlement.delete' event`);
        try {
          entitlementDeleteCallbackRef.current?.({
            entitlementId: decision.entitlementId,
            ttvUserId: decision.ttvUserId,
          });
        } catch (error) {
          logEventHandlerError('entitlement.delete', error);
        }
        break;
      }

      case 'eventInterpretationFailed': {
        if (decision.eventType !== 'cosmetic.create') {
          logger.stvWs.info(`💚 Received WS '${decision.eventType}' event`);
        }
        logEventHandlerError(decision.eventType, decision.error);
        break;
      }

      case 'unhandledEventType': {
        logger.stvWs.debug(
          `[DEFAULT CASE] Unhandled event type: ${decision.eventType}`,
        );
        break;
      }

      case 'notifyEvent': {
        if (eventCallbackRef.current) {
          eventCallbackRef.current(decision.eventType, decision.data);
        }
        break;
      }

      case 'ignoreDispatch': {
        if (decision.reason === 'missingEventData') {
          logger.stvWs.error('message.d is undefined or null');
        } else {
          logger.stvWs.error('message.d does not have expected structure');
        }
        break;
      }

      case 'heartbeat': {
        logger.stvWs.info(
          `💚 Received WS heartbeat event. Total received: ${decision.count}`,
        );
        break;
      }

      case 'ack': {
        logger.stvWs.info(`💚 Received WS ACK event: ${decision.command}`);
        break;
      }

      case 'hello': {
        logger.stvWs.info(`💚 Received WS hello/ACK event`);
        break;
      }

      case 'invalidSubscriptionCondition': {
        logger.stvWs.warn(
          `💚 Received invalid subscription condition: ${JSON.stringify(
            decision.payload,
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

      case 'serverRequest': {
        logger.stvWs.info(`💚 Received server req connection`);
        break;
      }

      case 'unhandledOp': {
        logger.stvWs.debug(`Unhandled op code ${decision.op}`);
        break;
      }
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data as string) as SevenTvWsMessage<
        SevenTvEventData<SevenTvEventType>
      >;

      logger.stvWs.debug('[handleMessage] op:', message.op);

      const decisions = interpretSeventvWsMessage(message, {
        expectedEmoteSetId:
          sevenTvEmoteSetIdRef.current || currentEmoteSetIdRef.current,
        connectionTimestamp: connectionTimestampRef.current,
        channelId: twitchChannelIdRef.current,
        now: Date.now(),
      });

      decisions.forEach(executeDecision);
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
      sendJsonMessage(
        buildEmoteSetUpdateUnsubscribeMessage(currentEmoteSetIdRef.current),
      );
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
      sendJsonMessage(
        buildEmoteSetUpdateUnsubscribeMessage(currentEmoteSetIdRef.current),
      );
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
