import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { batch } from '@legendapp/state';
import { usePathname } from 'expo-router';

import { useLazyRef } from '@app/hooks/use-lazy-ref';
import { useSyncRef } from '@app/hooks/use-sync-ref';
import { useUnmountCallback } from '@app/hooks/use-unmount-callback';
import { ReadyState } from '@app/hooks/ws/constants';
import { useWebsocket } from '@app/hooks/ws/use-websocket';
import type {
  CosmeticCreateCallbackData,
  CosmeticDeleteCallbackData,
  CosmeticUpdateCallbackData,
  EntitlementCreateCallbackData,
  EntitlementDeleteCallbackData,
  EntitlementResetCallbackData,
  EntitlementUpdateCallbackData,
  SevenTvEventData,
  SevenTvEventType,
  SevenTvWsMessage,
} from '@app/types/seven-tv/cosmetics';
import { SEVEN_TV_RECONNECT_POLICY } from '@app/utils/async/reconnectPolicy';
import { logger } from '@app/utils/logger';
import { createSevenTvSessionState } from '@app/utils/seven-tv/sevenTvSessionState';
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
  interpretSevenTvWsMessage,
  type SevenTvWsDecision,
} from '@app/utils/seven-tv/sevenTvWsInterpreter';

type SendSevenTvWsMessage = (
  message: SevenTvWsMessage<never, SevenTvEventType>,
) => void;

interface EmoteSetSwitchCallbackData {
  oldSetId: string | null;
  newSetId: string;
  newSetName: string | null;
}

interface UseSevenTvWsOptions {
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
   * The channel owner's 7TV user id; when set, subscribes to `user.update`
   * so live emote-set switches are detected.
   */
  sevenTvChannelUserId?: string;
}

interface UseSevenTvWsReturn {
  subscribeToChannel: (emoteSetId: string) => void;
  unsubscribeFromChannel: () => void;
  isConnected: () => boolean;
  readyState: ReadyState;
}

const DEFAULT_URL = 'wss://events.7tv.io/v3';

// If the RESUME ack never arrives, fall back to fresh subscriptions.
const RESUME_ACK_TIMEOUT = 5000;

// Mobile sockets go half-open without onclose; prolonged heartbeat silence
// closes the socket so reconnect + RESUME kicks in (same as the IRC PING watchdog).
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

const HEARTBEAT_WATCHDOG_TICK_MS = 10_000;
const MISSED_HEARTBEATS_BEFORE_RECONNECT = 3;

function logEventHandlerError(
  eventType: HandledSevenTvEventType,
  error: unknown,
) {
  logger.stvWs.error(`Error handling ${eventType}:`, error);
}

/**
 * Runs one consumer callback. A throwing consumer must not stop the socket
 * from handling the rest of the frame.
 */
function guardCallback(eventType: HandledSevenTvEventType, run: () => void) {
  try {
    run();
  } catch (error) {
    logEventHandlerError(eventType, error);
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

type SevenTvWsDecisionDeps = {
  currentScreen: string | null;
  getWebSocket: () => WebSocket;
  handleResumeAckTimeout: () => void;
  optionsRef: RefObject<UseSevenTvWsOptions | undefined>;
  runInitialSubscriptions: () => void;
  sendJsonMessage: SendSevenTvWsMessage;
  session: ReturnType<typeof createSevenTvSessionState>;
  sevenTvEmoteSetIdRef: RefObject<string | undefined>;
  twitchChannelIdRef: RefObject<string | undefined>;
};

function runSevenTvWsDecision(
  decision: SevenTvWsDecision,
  {
    currentScreen,
    getWebSocket,
    handleResumeAckTimeout,
    optionsRef,
    runInitialSubscriptions,
    sendJsonMessage,
    session,
    sevenTvEmoteSetIdRef,
    twitchChannelIdRef,
  }: SevenTvWsDecisionDeps,
): void {
  switch (decision.type) {
    case 'applyEmoteUpdate': {
      logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);

      logger.stvWs.info(
        `💚 Processing emote set update: +${decision.added.length} -${decision.removed.length} emotes`,
      );

      guardCallback('emote_set.update', () => {
        optionsRef.current?.onEmoteUpdate?.({
          added: decision.added,
          removed: decision.removed,
          channelId: decision.channelId,
        });
      });

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
      guardCallback('emote_set.update', () => {
        optionsRef.current?.onEmoteSetUpdateForOtherSet?.(decision.emoteSetId);
      });

      break;
    }

    case 'applyEmoteSetSwitch': {
      logger.stvWs.info(
        `💚 Channel switched 7TV emote set: ${decision.oldSetId ?? 'none'} -> ${decision.newSetId}`,
      );

      guardCallback('user.update', () => {
        optionsRef.current?.onEmoteSetSwitch?.({
          oldSetId: decision.oldSetId,
          newSetId: decision.newSetId,
          newSetName: decision.newSetName,
        });
      });

      break;
    }

    case 'ignoreUserUpdate': {
      break;
    }

    case 'applyCosmeticCreate': {
      guardCallback('cosmetic.create', () => {
        optionsRef.current?.onCosmeticCreate?.({
          cosmetic: decision.cosmetic,
          kind: decision.kind,
        });
      });

      break;
    }

    case 'ignoreCosmeticCreate': {
      break;
    }

    case 'applyEntitlementCreate': {
      if (__DEV__) {
        // Entitlement bursts arrive hundreds at a time; release drops info logs, so skip building the strings.
        logger.stvWs.info(`💚 Received WS 'entitlement.create' event`);
        logger.stvWs.info(
          `Entitlement create: ${decision.kind} for user ${decision.userDisplayName} (ttv: ${decision.ttvUserId}, paint: ${decision.paintId}, badge: ${decision.badgeId})`,
        );
      }

      guardCallback('entitlement.create', () => {
        optionsRef.current?.onEntitlementCreate?.({
          entitlement: decision.entitlement,
          kind: decision.kind,
          ttvUserId: decision.ttvUserId,
          paintId: decision.paintId,
          badgeId: decision.badgeId,
        });
      });

      break;
    }

    case 'applyCosmeticUpdate': {
      logger.stvWs.info(`💚 Received WS 'cosmetic.update' event`);

      guardCallback('cosmetic.update', () => {
        optionsRef.current?.onCosmeticUpdate?.({
          changes: decision.changes,
          kind: decision.kind,
        });
      });

      break;
    }

    case 'applyCosmeticDelete': {
      logger.stvWs.info(`💚 Received WS 'cosmetic.delete' event`);

      guardCallback('cosmetic.delete', () => {
        optionsRef.current?.onCosmeticDelete?.({
          cosmeticId: decision.cosmeticId,
        });
      });

      break;
    }

    case 'applyEntitlementUpdate': {
      logger.stvWs.info(`💚 Received WS 'entitlement.update' event`);

      guardCallback('entitlement.update', () => {
        optionsRef.current?.onEntitlementUpdate?.({
          changes: decision.changes,
          ttvUserId: decision.ttvUserId,
          paintId: decision.paintId,
          badgeId: decision.badgeId,
        });
      });

      break;
    }

    case 'applyEntitlementDelete': {
      logger.stvWs.info(`💚 Received WS 'entitlement.delete' event`);

      guardCallback('entitlement.delete', () => {
        optionsRef.current?.onEntitlementDelete?.({
          entitlementId: decision.entitlementId,
          ttvUserId: decision.ttvUserId,
        });
      });

      break;
    }

    case 'applyEntitlementReset': {
      logger.stvWs.info(`💚 Received WS 'entitlement.reset' event`);

      guardCallback('entitlement.reset', () => {
        optionsRef.current?.onEntitlementReset?.({
          sevenTvUserId: decision.sevenTvUserId,
        });
      });

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
      optionsRef.current?.onEvent?.(decision.eventType, decision.data);
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
      const previousSessionId = session.sessionId;
      session.sessionId = decision.sessionId;

      session.heartbeatIntervalMs =
        decision.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;

      if (session.shouldResume && previousSessionId) {
        session.shouldResume = false;
        session.resumePending = true;
        sendJsonMessage(buildResumeMessage(previousSessionId));

        logger.stvWs.info(
          `💚 Attempting session resume for ${previousSessionId}`,
        );

        session.clearResumeFallbackTimer();

        session.resumeFallbackTimer = setTimeout(
          handleResumeAckTimeout,
          RESUME_ACK_TIMEOUT,
        );
      }

      session.shouldResume = false;
      break;
    }

    case 'resumeAck': {
      session.clearResumeFallbackTimer();

      if (!session.resumePending) {
        break;
      }

      session.resumePending = false;

      if (decision.success) {
        // Subscriptions were restored server-side and missed dispatches
        // replayed; treat the replays as live instead of historical.
        session.hasInitialSubscriptions = true;

        session.connectionTimestamp = Date.now() - HISTORICAL_EVENT_BUFFER;

        logger.stvWs.info(
          `💚 Session resumed: ${decision.dispatchesReplayed} dispatches replayed, ${decision.subscriptionsRestored} subscriptions restored`,
        );
      } else {
        logger.stvWs.info('💚 Session resume failed; resubscribing');
        runInitialSubscriptions();
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
      session.hasInitialSubscriptions = false;
      break;
    }

    case 'unhandledOp': {
      logger.stvWs.debug(`Unhandled op code ${decision.op}`);
      break;
    }
  }
}

export function useSevenTvWs(
  options?: UseSevenTvWsOptions,
): UseSevenTvWsReturn {
  const sessionRef = useLazyRef(() =>
    createSevenTvSessionState({
      defaultHeartbeatIntervalMs: DEFAULT_HEARTBEAT_INTERVAL_MS,
    }),
  );

  const optionsRef = useSyncRef(options);
  const pathname = usePathname();

  const twitchChannelIdRef = useSyncRef(options?.twitchChannelId);

  const sevenTvEmoteSetIdRef = useSyncRef(options?.sevenTvEmoteSetId);

  const sevenTvChannelUserIdRef = useSyncRef(options?.sevenTvChannelUserId);
  const unsubscribeChannelScopedSubscriptions = (
    sendJson: SendSevenTvWsMessage,
  ) => {
    const session = sessionRef.current;

    if (getWebSocket().readyState !== WebSocket.OPEN) {
      session.subscribedChannelId = null;
      session.subscribedOwnerId = null;
      return;
    }

    if (session.subscribedChannelId) {
      sendJson(
        buildEntitlementCreateUnsubscribeMessage(session.subscribedChannelId),
      );

      sendJson(
        buildCosmeticCreateUnsubscribeMessage(session.subscribedChannelId),
      );

      session.subscribedChannelId = null;
    }

    if (session.subscribedOwnerId) {
      sendJson(buildUserUpdateUnsubscribeMessage(session.subscribedOwnerId));
      session.subscribedOwnerId = null;
    }
  };

  const currentScreen = getSevenTvChatScreenFromPathname(pathname);

  // The socket opens only once both ids are known, so the first subscribe never waits for them.
  const shouldConnect = Boolean(
    currentScreen && options?.twitchChannelId && options?.sevenTvEmoteSetId,
  );

  const sendSubscription = (
    emoteSetId: string,
    sendJson: SendSevenTvWsMessage,
  ) => {
    logger.stvWs.info(`💚 Attempting to subscribe to emote set: ${emoteSetId}`);

    const session = sessionRef.current;
    const channelId = twitchChannelIdRef.current;

    const isChannelHop =
      Boolean(channelId) &&
      Boolean(session.subscribedChannelId) &&
      session.subscribedChannelId !== channelId;

    if (isChannelHop) {
      unsubscribeChannelScopedSubscriptions(sendJson);
    }

    if (channelId) {
      sendJson(buildEntitlementCreateSubscribeMessage(channelId, Date.now()));
      sendJson(buildCosmeticCreateSubscribeMessage(channelId, Date.now()));
      session.subscribedChannelId = channelId;
    }

    sendJson(buildEmoteSetUpdateSubscribeMessage(emoteSetId));

    logger.stvWs.info(
      `✅ Successfully sent subscription for emote set: ${emoteSetId}`,
    );
  };

  /**
   * Subscribes a fresh session to the channel, the owner and the emote set,
   * and records each one, so `subscribeToChannel` does not send them again.
   */
  const runInitialSubscriptions = () => {
    const session = sessionRef.current;
    const twitchChannelId = twitchChannelIdRef.current;
    const ownerId = sevenTvChannelUserIdRef.current;
    const emoteSetId = sevenTvEmoteSetIdRef.current;

    if (twitchChannelId) {
      sendJsonMessage(
        buildEntitlementCreateSubscribeMessage(twitchChannelId, Date.now()),
      );

      sendJsonMessage(
        buildCosmeticCreateSubscribeMessage(twitchChannelId, Date.now()),
      );

      session.subscribedChannelId = twitchChannelId;
    }

    if (ownerId) {
      sendJsonMessage(buildUserUpdateSubscribeMessage(ownerId));
      session.subscribedOwnerId = ownerId;
    }

    if (emoteSetId) {
      sendJsonMessage(
        buildEmoteSetUpdateSubscribeMessage(emoteSetId, Date.now()),
      );
      session.currentEmoteSetId = emoteSetId;
      session.activeSubscriptions.add(emoteSetId);
    }

    session.hasInitialSubscriptions = true;
    logger.stvWs.info('💚 Sent initial 7TV subscriptions');
  };

  const handleResumeAckTimeout = () => {
    const session = sessionRef.current;

    if (!session.resumePending) {
      return;
    }

    session.resumePending = false;

    logger.stvWs.warn('7TV resume ack timed out; resubscribing', {
      name: 'seven_tv_ws_warning',
      action: 'resume_ack_timeout',
      channel_id: twitchChannelIdRef.current,
      provider: 'seven_tv',
    });

    runInitialSubscriptions();
  };

  const executeDecision = (decision: SevenTvWsDecision) => {
    runSevenTvWsDecision(decision, {
      currentScreen,
      getWebSocket,
      handleResumeAckTimeout,
      optionsRef,
      runInitialSubscriptions,
      sendJsonMessage,
      session: sessionRef.current,
      sevenTvEmoteSetIdRef,
      twitchChannelIdRef,
    });
  };

  const pendingEntitlementsRef = useRef<SevenTvWsDecision[]>([]);
  const entitlementFlushRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const flushPendingEntitlements = () => {
    if (entitlementFlushRef.current) {
      clearTimeout(entitlementFlushRef.current);
      entitlementFlushRef.current = null;
    }

    const pending = pendingEntitlementsRef.current;

    if (pending.length === 0) {
      return;
    }

    pendingEntitlementsRef.current = [];

    batch(() => {
      for (let index = 0; index < pending.length; index += 1) {
        const decision = pending[index];

        if (!decision) {
          continue;
        }

        try {
          executeDecision(decision);
        } catch (error) {
          logger.stvWs.warn('Failed to apply a queued 7TV decision', {
            name: 'seven_tv_ws_warning',
            error: error instanceof Error ? error : String(error),
            action: 'entitlement_flush_failed',
            provider: 'seven_tv',
          });
          pendingEntitlementsRef.current = pending.slice(index);
          return;
        }
      }
    });
  };

  // Entitlement bursts arrive hundreds at a time, so they commit together on the next frame.
  const queueEntitlementDecisions = (decisions: SevenTvWsDecision[]) => {
    pendingEntitlementsRef.current.push(...decisions);

    if (entitlementFlushRef.current === null) {
      entitlementFlushRef.current = setTimeout(flushPendingEntitlements, 16);
    }
  };

  const handleMessage = (event: MessageEvent<string>) => {
    sessionRef.current.lastMessageAt = Date.now();

    try {
      // SAFETY: a non-envelope body fails on `message.op` in this try and hits the catch.
      const message = JSON.parse(event.data) as SevenTvWsMessage<
        SevenTvEventData<SevenTvEventType>
      >;

      if (__DEV__) {
        logger.stvWs.debug('[handleMessage] op:', message.op);
      }

      const decisions = interpretSevenTvWsMessage(message, {
        expectedEmoteSetId:
          sevenTvEmoteSetIdRef.current || sessionRef.current.currentEmoteSetId,
        connectionTimestamp: sessionRef.current.connectionTimestamp,
        channelId: twitchChannelIdRef.current,
        now: Date.now(),
      });

      const shouldCoalesceEntitlements =
        decisions.some(
          decision => decision.type === 'applyEntitlementCreate',
        ) &&
        decisions.every(
          decision =>
            decision.type === 'applyEntitlementCreate' ||
            decision.type === 'notifyEvent',
        );

      if (shouldCoalesceEntitlements) {
        queueEntitlementDecisions(decisions);
        return;
      }

      flushPendingEntitlements();
      decisions.forEach(executeDecision);
    } catch (error) {
      logger.stvWs.warn('Failed to parse STV message', {
        name: 'seven_tv_ws_warning',
        error: error instanceof Error ? error : String(error),
        action: 'message_parse_failed',
        channel_id: twitchChannelIdRef.current,
        provider: 'seven_tv',
        screen: currentScreen,
        seven_tv_emote_set_id: sevenTvEmoteSetIdRef.current,
      });
    }
  };

  useUnmountCallback(flushPendingEntitlements);

  const { getWebSocket, sendJsonMessage, readyState, reconnect } = useWebsocket<
    SevenTvWsMessage<never, SevenTvEventType>
  >(shouldConnect ? DEFAULT_URL : null, {
    onOpen: () => {
      logger.stvWs.info('💚 SevenTV WebSocket connected');
      const session = sessionRef.current;
      session.connectionTimestamp = Date.now();
      session.lastMessageAt = Date.now();
      session.stopHeartbeatWatchdog();

      session.heartbeatWatchdog = setInterval(() => {
        const ws = getWebSocket();

        if (ws.readyState !== WebSocket.OPEN) {
          return;
        }

        const silenceMs = Date.now() - session.lastMessageAt;

        const timeoutMs =
          session.heartbeatIntervalMs * MISSED_HEARTBEATS_BEFORE_RECONNECT;

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

      // RESUME restores subscriptions server-side; only subscribe from scratch with no resumable session.
      const willAttemptResume =
        session.shouldResume && session.sessionId !== null;

      if (!session.hasInitialSubscriptions && !willAttemptResume) {
        runInitialSubscriptions();
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

      const session = sessionRef.current;

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

        // Unexpected close: RESUME on next connect so missed dispatches replay.
        session.shouldResume = session.sessionId !== null;
      }

      session.reset('close');
    },
    onError: (error: Event) => {
      logger.stvWs.warn(
        `💚 SevenTv WS error: ${JSON.stringify(error, null, 2)}`,
        {
          name: 'seven_tv_ws_warning',
          error: error instanceof Error ? error : String(error),
          action: 'error',
          channel_id: twitchChannelIdRef.current,
          provider: 'seven_tv',
          screen: currentScreen,
          seven_tv_emote_set_id: sevenTvEmoteSetIdRef.current,
        },
      );
    },
    shouldReconnect: (event: CloseEvent) =>
      shouldConnect && event.code !== 1000,
    reconnectPolicy: SEVEN_TV_RECONNECT_POLICY,
  });

  const subscribeToChannel = (emoteSetId: string) => {
    const session = sessionRef.current;
    const ws = getWebSocket();

    if (session.activeSubscriptions.has(emoteSetId)) {
      logger.stvWs.info(`💚 Already subscribed to emote set: ${emoteSetId}`);
      return;
    }

    if (
      session.currentEmoteSetId &&
      session.currentEmoteSetId !== emoteSetId &&
      ws.readyState === WebSocket.OPEN
    ) {
      sendJsonMessage(
        buildEmoteSetUpdateUnsubscribeMessage(session.currentEmoteSetId),
      );
      session.activeSubscriptions.delete(session.currentEmoteSetId);
    }

    session.currentEmoteSetId = emoteSetId;

    if (ws.readyState === WebSocket.OPEN && emoteSetId) {
      sendSubscription(emoteSetId, sendJsonMessage);
      session.activeSubscriptions.add(emoteSetId);
    }

    logger.stvWs.info(`💚 Set current emote set: ${emoteSetId}`);
  };

  const unsubscribeFromChannel = useCallback(() => {
    const session = sessionRef.current;
    const ws = getWebSocket();

    if (session.currentEmoteSetId && ws.readyState === WebSocket.OPEN) {
      sendJsonMessage(
        buildEmoteSetUpdateUnsubscribeMessage(session.currentEmoteSetId),
      );
      session.activeSubscriptions.delete(session.currentEmoteSetId);
    }

    unsubscribeChannelScopedSubscriptions(sendJsonMessage);

    session.currentEmoteSetId = undefined;
    logger.stvWs.info('💚 Cleared current emote set');
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- unsubscribeChannelScopedSubscriptions is a stable closure over refs
  }, [getWebSocket, sendJsonMessage, sessionRef]);

  const unsubscribeFromChannelRef = useSyncRef(unsubscribeFromChannel);

  const isConnected = useCallback(
    () => getWebSocket().readyState === WebSocket.OPEN,
    [getWebSocket],
  );

  const shouldConnectRef = useSyncRef(shouldConnect);

  // A long background stretch can exhaust the retry budget; foregrounding
  // with a dead socket forces a fresh connect (then RESUME).
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
  }, [getWebSocket, reconnect, shouldConnectRef]);

  // The owner's 7TV id resolves async and can land after initial
  // subscriptions; (re)subscribe user.update when it arrives or changes.
  // oxlint-disable-next-line react-doctor/no-event-handler -- syncs a WS subscription to an async id, not a UI event
  const sevenTvChannelUserId = options?.sevenTvChannelUserId;

  const syncChannelOwnerSubscription = (ownerId: string) => {
    const session = sessionRef.current;
    const ws = getWebSocket();

    if (
      ws.readyState !== WebSocket.OPEN ||
      !session.hasInitialSubscriptions ||
      session.subscribedOwnerId === ownerId
    ) {
      return;
    }

    if (session.subscribedOwnerId) {
      sendJsonMessage(
        buildUserUpdateUnsubscribeMessage(session.subscribedOwnerId),
      );
    }

    sendJsonMessage(buildUserUpdateSubscribeMessage(ownerId));
    session.subscribedOwnerId = ownerId;
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

  useUnmountCallback(() => {
    logger.stvWs.info('[useSevenTvWs] Cleaning up SevenTV WS client');
    unsubscribeFromChannelRef.current();
    sessionRef.current.reset('unmount');
  });

  return {
    subscribeToChannel,
    unsubscribeFromChannel,
    isConnected,
    readyState,
  };
}
