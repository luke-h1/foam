import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

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
  type EntitlementResetCallbackData,
  type EntitlementUpdateCallbackData,
  SevenTvEventData,
  SevenTvEventType,
  SevenTvWsMessage,
} from '@app/types/seventv/cosmetics';
import { logger } from '@app/utils/logger';
import { setSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';
import {
  buildCosmeticCreateSubscribeMessage,
  buildCosmeticCreateUnsubscribeMessage,
  buildEmoteSetUpdateSubscribeMessage,
  buildEmoteSetUpdateUnsubscribeMessage,
  buildEntitlementCreateSubscribeMessage,
  buildEntitlementCreateUnsubscribeMessage,
  buildResumeMessage,
  buildUserUpdateSubscribeMessage,
  buildUserUpdateUnsubscribeMessage,
  type EmoteUpdateCallbackData,
  type HandledSevenTvEventType,
  HISTORICAL_EVENT_BUFFER,
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
  EntitlementResetCallbackData,
  EntitlementUpdateCallbackData,
  SevenTvEventData,
  SevenTvEventType,
};

export interface EmoteSetSwitchCallbackData {
  oldSetId: string | null;
  newSetId: string;
  newSetName: string | null;
}

interface UseSeventvWsOptions {
  onEmoteUpdate?: (data: EmoteUpdateCallbackData) => void;
  onEmoteSetSwitch?: (data: EmoteSetSwitchCallbackData) => void;
  onEmoteSetUpdateForOtherSet?: (emoteSetId: string) => void;
  onCosmeticCreate?: (data: CosmeticCreateCallbackData) => void;
  onCosmeticUpdate?: (data: CosmeticUpdateCallbackData) => void;
  onCosmeticDelete?: (data: CosmeticDeleteCallbackData) => void;
  onEntitlementCreate?: (data: EntitlementCreateCallbackData) => void;
  onEntitlementUpdate?: (data: EntitlementUpdateCallbackData) => void;
  onEntitlementDelete?: (data: EntitlementDeleteCallbackData) => void;
  onEntitlementReset?: (data: EntitlementResetCallbackData) => void;
  onEvent?: (
    eventType: SevenTvEventType,
    data: SevenTvEventData<SevenTvEventType>,
  ) => void;
  twitchChannelId?: string;
  sevenTvEmoteSetId?: string;
  /**
   * The channel owner's 7TV user id; when set, the hook subscribes to
   * `user.update` for the owner so live emote-set switches are detected.
   */
  sevenTvChannelUserId?: string;
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
// If the RESUME ack never arrives, fall back to fresh subscriptions.
const RESUME_ACK_TIMEOUT = 5000;
// Mobile sockets go half-open without firing onclose; treat prolonged
// heartbeat silence as a dead connection and close so reconnect + RESUME
// kicks in (same lesson as the IRC socket's PING watchdog).
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000;
const HEARTBEAT_WATCHDOG_TICK_MS = 10000;
const MISSED_HEARTBEATS_BEFORE_RECONNECT = 3;
// Per-outage retry budget; the counter resets on every successful open and
// a foreground transition force-revives an exhausted socket anyway.
const RECONNECT_ATTEMPTS = 60;

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
  const entitlementResetCallbackRef = useRef(options?.onEntitlementReset);
  const eventCallbackRef = useRef(options?.onEvent);
  const connectionTimestampRef = useRef<number | null>(null);
  const pathname = usePathname();

  const twitchChannelIdRef = useRef<string | undefined>(undefined);
  const sevenTvEmoteSetIdRef = useRef<string | undefined>(undefined);

  const currentEmoteSetIdRef = useRef<string | undefined>(undefined);
  const activeSubscriptionsRef = useLazyRef(() => new Set<string>());
  const hasInitialSubscriptionsRef = useRef<boolean>(false);

  // Session RESUME state: after an unexpected close we ask the server to
  // replay missed dispatches instead of resubscribing from scratch.
  const sessionIdRef = useRef<string | null>(null);
  const shouldResumeRef = useRef(false);
  const resumePendingRef = useRef(false);
  const resumeFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearResumeFallbackTimer = () => {
    if (resumeFallbackTimerRef.current) {
      clearTimeout(resumeFallbackTimerRef.current);
      resumeFallbackTimerRef.current = null;
    }
  };

  // Channel-scoped subscription bookkeeping so a channel switch on a live
  // socket unsubscribes the previous channel instead of accumulating
  // entitlement/cosmetic streams for channels we've left.
  const subscribedChannelIdRef = useRef<string | null>(null);
  const subscribedOwnerIdRef = useRef<string | null>(null);
  const sevenTvChannelUserIdRef = useRef<string | undefined>(undefined);
  const emoteSetSwitchCallbackRef = useRef(options?.onEmoteSetSwitch);
  const otherSetUpdateCallbackRef = useRef(
    options?.onEmoteSetUpdateForOtherSet,
  );

  // Heartbeat liveness state.
  const heartbeatIntervalMsRef = useRef<number>(DEFAULT_HEARTBEAT_INTERVAL_MS);
  const lastMessageAtRef = useRef<number>(0);
  const heartbeatWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const stopHeartbeatWatchdog = () => {
    if (heartbeatWatchdogRef.current) {
      clearInterval(heartbeatWatchdogRef.current);
      heartbeatWatchdogRef.current = null;
    }
  };

  const unsubscribeChannelScopedSubscriptions = (
    sendJsonMessage: (msg: unknown) => void,
  ) => {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      subscribedChannelIdRef.current = null;
      subscribedOwnerIdRef.current = null;
      return;
    }
    if (subscribedChannelIdRef.current) {
      sendJsonMessage(
        buildEntitlementCreateUnsubscribeMessage(
          subscribedChannelIdRef.current,
        ),
      );
      sendJsonMessage(
        buildCosmeticCreateUnsubscribeMessage(subscribedChannelIdRef.current),
      );
      subscribedChannelIdRef.current = null;
    }
    if (subscribedOwnerIdRef.current) {
      sendJsonMessage(
        buildUserUpdateUnsubscribeMessage(subscribedOwnerIdRef.current),
      );
      subscribedOwnerIdRef.current = null;
    }
  };

  emoteCallbackRef.current = options?.onEmoteUpdate;
  cosmeticCallbackRef.current = options?.onCosmeticCreate;
  cosmeticUpdateCallbackRef.current = options?.onCosmeticUpdate;
  cosmeticDeleteCallbackRef.current = options?.onCosmeticDelete;
  entitlementCallbackRef.current = options?.onEntitlementCreate;
  entitlementUpdateCallbackRef.current = options?.onEntitlementUpdate;
  entitlementDeleteCallbackRef.current = options?.onEntitlementDelete;
  entitlementResetCallbackRef.current = options?.onEntitlementReset;
  eventCallbackRef.current = options?.onEvent;
  twitchChannelIdRef.current = options?.twitchChannelId;
  sevenTvEmoteSetIdRef.current = options?.sevenTvEmoteSetId;
  sevenTvChannelUserIdRef.current = options?.sevenTvChannelUserId;
  emoteSetSwitchCallbackRef.current = options?.onEmoteSetSwitch;
  otherSetUpdateCallbackRef.current = options?.onEmoteSetUpdateForOtherSet;

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
      // Switching channels on a live socket: drop the previous channel's
      // entitlement/cosmetic/user streams before subscribing the new one.
      if (
        subscribedChannelIdRef.current &&
        subscribedChannelIdRef.current !== twitchChannelIdRef.current
      ) {
        unsubscribeChannelScopedSubscriptions(sendJsonMessage);
      }
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
      subscribedChannelIdRef.current = twitchChannelIdRef.current;
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
      subscribedChannelIdRef.current = twitchChannelIdRef.current;
      logger.stvWs.info(
        '💚 Subscribed to entitlement.create and cosmetic.create events',
      );
      logger.stvWs.info(
        '💚 Note: update/delete events will be handled through general event stream',
      );
    }

    if (sevenTvChannelUserIdRef.current) {
      sendJsonMessage(
        buildUserUpdateSubscribeMessage(sevenTvChannelUserIdRef.current),
      );
      subscribedOwnerIdRef.current = sevenTvChannelUserIdRef.current;
      logger.stvWs.info('💚 Subscribed to channel owner user.update events');
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
        if (decision.reason === 'historicalEvent') {
          logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);
          logger.stvWs.info(
            '💚 Ignoring potential historical emote set update event (within buffer period)',
          );
        } else if (decision.reason === 'noChanges') {
          logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);
        }
        break;
      }

      case 'emoteSetUpdateForOtherSet': {
        try {
          otherSetUpdateCallbackRef.current?.(decision.emoteSetId);
        } catch (error) {
          logEventHandlerError('emote_set.update', error);
        }
        break;
      }

      case 'applyEmoteSetSwitch': {
        logger.stvWs.info(
          `💚 Channel switched 7TV emote set: ${decision.oldSetId ?? 'none'} -> ${decision.newSetId}`,
        );
        try {
          emoteSetSwitchCallbackRef.current?.({
            oldSetId: decision.oldSetId,
            newSetId: decision.newSetId,
            newSetName: decision.newSetName,
          });
        } catch (error) {
          logEventHandlerError('emote_set.update', error);
        }
        break;
      }

      case 'ignoreUserUpdate': {
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
        if (__DEV__) {
          // Entitlement bursts arrive at hundreds per channel entry; release
          // severity drops info logs anyway, so don't build the template
          // strings there.
          logger.stvWs.info(`💚 Received WS 'entitlement.create' event`);
          logger.stvWs.info(
            `Entitlement create: ${decision.kind} for user ${decision.userDisplayName} (ttv: ${decision.ttvUserId}, paint: ${decision.paintId}, badge: ${decision.badgeId})`,
          );
        }
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

      case 'applyEntitlementReset': {
        logger.stvWs.info(`💚 Received WS 'entitlement.reset' event`);
        try {
          entitlementResetCallbackRef.current?.({
            sevenTvUserId: decision.sevenTvUserId,
          });
        } catch (error) {
          logEventHandlerError('entitlement.reset', error);
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
        const previousSessionId = sessionIdRef.current;
        sessionIdRef.current = decision.sessionId;
        setSevenTvSessionId(decision.sessionId);
        heartbeatIntervalMsRef.current =
          decision.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;

        if (shouldResumeRef.current && previousSessionId) {
          shouldResumeRef.current = false;
          resumePendingRef.current = true;
          sendJsonMessage(buildResumeMessage(previousSessionId));
          logger.stvWs.info(
            `💚 Attempting session resume for ${previousSessionId}`,
          );
          clearResumeFallbackTimer();
          resumeFallbackTimerRef.current = setTimeout(() => {
            if (!resumePendingRef.current) {
              return;
            }
            resumePendingRef.current = false;
            logger.stvWs.warn('7TV resume ack timed out; resubscribing', {
              name: 'seven_tv_ws_warning',
              action: 'resume_ack_timeout',
              channel_id: twitchChannelIdRef.current,
              provider: 'seven_tv',
            });
            void setupInitialSubscriptions(sendJsonMessage).then(() => {
              hasInitialSubscriptionsRef.current = true;
            });
          }, RESUME_ACK_TIMEOUT);
        }
        shouldResumeRef.current = false;
        break;
      }

      case 'resumeAck': {
        clearResumeFallbackTimer();
        if (!resumePendingRef.current) {
          break;
        }
        resumePendingRef.current = false;
        if (decision.success) {
          // Subscriptions were restored server-side and missed dispatches
          // replayed; treat the replays as live instead of historical.
          hasInitialSubscriptionsRef.current = true;
          connectionTimestampRef.current = Date.now() - HISTORICAL_EVENT_BUFFER;
          logger.stvWs.info(
            `💚 Session resumed: ${decision.dispatchesReplayed} dispatches replayed, ${decision.subscriptionsRestored} subscriptions restored`,
          );
        } else {
          logger.stvWs.info('💚 Session resume failed; resubscribing');
          void setupInitialSubscriptions(sendJsonMessage).then(() => {
            hasInitialSubscriptionsRef.current = true;
          });
        }
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

      case 'reconnect': {
        logger.stvWs.info(`💚 Received server reconnect request`);
        const ws = getWebSocket();
        ws.close(4003, '7tv reconnect requested');
        hasInitialSubscriptionsRef.current = false;
        break;
      }

      case 'unhandledOp': {
        logger.stvWs.debug(`Unhandled op code ${decision.op}`);
        break;
      }
    }
  };

  const handleMessage = (event: MessageEvent) => {
    lastMessageAtRef.current = Date.now();
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

  const { getWebSocket, sendJsonMessage, readyState, reconnect } = useWebsocket(
    shouldConnect ? DEFAULT_URL : null,
    {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onOpen: async () => {
        logger.stvWs.info('💚 SevenTV WebSocket connected');
        connectionTimestampRef.current = Date.now();
        lastMessageAtRef.current = Date.now();
        stopHeartbeatWatchdog();
        heartbeatWatchdogRef.current = setInterval(() => {
          const ws = getWebSocket();
          if (!ws || ws.readyState !== WebSocket.OPEN) {
            return;
          }
          const silenceMs = Date.now() - lastMessageAtRef.current;
          const timeoutMs =
            heartbeatIntervalMsRef.current * MISSED_HEARTBEATS_BEFORE_RECONNECT;
          if (silenceMs > timeoutMs) {
            logger.stvWs.warn('7TV socket silent past heartbeat budget', {
              name: 'seven_tv_ws_warning',
              action: 'heartbeat_timeout',
              channel_id: twitchChannelIdRef.current,
              provider: 'seven_tv',
              silence_ms: silenceMs,
            });
            ws.close(4008, '7tv heartbeat timeout');
          }
        }, HEARTBEAT_WATCHDOG_TICK_MS);

        // When resuming, subscriptions are restored server-side after the
        // RESUME handshake (sent on hello); only subscribe from scratch when
        // no resumable session exists.
        const willAttemptResume =
          shouldResumeRef.current && sessionIdRef.current !== null;

        if (!hasInitialSubscriptionsRef.current && !willAttemptResume) {
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
          // Unexpected close: try to RESUME the session on the next connect
          // so missed dispatches replay instead of being lost.
          shouldResumeRef.current = sessionIdRef.current !== null;
        }
        clearResumeFallbackTimer();
        stopHeartbeatWatchdog();
        resumePendingRef.current = false;
        hasInitialSubscriptionsRef.current = false;
        subscribedChannelIdRef.current = null;
        subscribedOwnerIdRef.current = null;
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
      reconnectAttempts: RECONNECT_ATTEMPTS,
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

    unsubscribeChannelScopedSubscriptions(sendJsonMessage);

    currentEmoteSetIdRef.current = undefined;
    logger.stvWs.info('💚 Cleared current emote set');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unsubscribeChannelScopedSubscriptions is a stable closure over refs
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

  const shouldConnectRef = useRef(false);
  shouldConnectRef.current = !!shouldConnect;

  // Automatic retries are budgeted per outage; a long background stretch can
  // exhaust them. Foregrounding with a dead socket forces a fresh connect
  // (which then attempts a session RESUME).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' || !shouldConnectRef.current) {
        return;
      }
      const ws = getWebSocket();
      if (ws.readyState === WebSocket.CLOSED) {
        logger.stvWs.info(
          '💚 App foregrounded with closed 7TV socket; reconnecting',
        );
        reconnect();
      }
    });
    return () => subscription.remove();
  }, [getWebSocket, reconnect]);

  // The channel owner's 7TV id resolves asynchronously and can land after
  // the initial subscriptions were sent; (re)subscribe user.update when it
  // becomes available or changes.
  // eslint-disable-next-line react-doctor/no-event-handler -- syncs an external WebSocket subscription to an async-resolved id, not a UI event
  const sevenTvChannelUserId = options?.sevenTvChannelUserId;
  const syncChannelOwnerSubscription = (ownerId: string) => {
    const ws = getWebSocket();
    if (
      ws.readyState !== WebSocket.OPEN ||
      !hasInitialSubscriptionsRef.current ||
      subscribedOwnerIdRef.current === ownerId
    ) {
      return;
    }
    if (subscribedOwnerIdRef.current) {
      sendJsonMessage(
        buildUserUpdateUnsubscribeMessage(subscribedOwnerIdRef.current),
      );
    }
    sendJsonMessage(buildUserUpdateSubscribeMessage(ownerId));
    subscribedOwnerIdRef.current = ownerId;
    logger.stvWs.info('💚 Subscribed to channel owner user.update events');
  };
  const syncChannelOwnerSubscriptionRef = useSyncRef(
    syncChannelOwnerSubscription,
  );

  useEffect(() => {
    if (sevenTvChannelUserId) {
      syncChannelOwnerSubscriptionRef.current(sevenTvChannelUserId);
    }
  }, [sevenTvChannelUserId, readyState, syncChannelOwnerSubscriptionRef]);

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
      // Leaving deliberately: drop the session instead of resuming it later.
      clearResumeFallbackTimer();
      stopHeartbeatWatchdog();
      sessionIdRef.current = null;
      shouldResumeRef.current = false;
      resumePendingRef.current = false;
      subscribedChannelIdRef.current = null;
      subscribedOwnerIdRef.current = null;
      setSevenTvSessionId(null);
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
    clearResumeFallbackTimer();
    stopHeartbeatWatchdog();
    sessionIdRef.current = null;
    shouldResumeRef.current = false;
    resumePendingRef.current = false;
    subscribedChannelIdRef.current = null;
    subscribedOwnerIdRef.current = null;
    setSevenTvSessionId(null);
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
