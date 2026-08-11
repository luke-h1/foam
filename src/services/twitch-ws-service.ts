import { AppState } from 'react-native';

import type {
  EventSubMessage,
  TwitchEventSubCallback,
} from '@app/types/twitch/eventsub';
import { logger } from '@app/utils/logger';

import { twitchService } from './twitch-service';

type EventCallback = TwitchEventSubCallback;

/**
 * One server-side EventSub subscription and its consumers. Identity is
 * eventType + condition, never eventType alone: two screens overlapping
 * during a transition hold subscriptions for two broadcasters of the same
 * event type, and keying by type made the second silently reuse (and the
 * first orphan) the other's server-side subscription.
 */
type EventSubEntry = {
  eventType: string;
  version: string;
  condition: Record<string, string>;
  callbacks: EventCallback[];
  subscriptionId: string | null;
};

type EventSubscriptionSummary = {
  id: string;
  type: string;
  condition?: Record<string, string>;
  transport: {
    session_id?: string;
  };
};

function conditionKey(condition: Record<string, string>): string {
  return Object.keys(condition)
    .sort()
    .map(key => `${key}=${condition[key]}`)
    .join(';');
}

function entryKey(
  eventType: string,
  condition: Record<string, string>,
): string {
  return `${eventType}|${conditionKey(condition)}`;
}

function hasEventSubscriptionData(
  response: unknown,
): response is { data: EventSubscriptionSummary[] } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    Array.isArray(response.data)
  );
}

/**
 * TODO: abstract methods to a interface using discriminated unions so that we can type it based on the provider we want to consume
 */
class TwitchWsService {
  private static instance: WebSocket | null = null;

  /**
   * @see https://dev.twitch.tv/docs/eventsub/handling-websocket-events and @see https://dev.twitch.tv/docs/eventsub/websocket-reference
   * for valid params
   */
  private static url: string = 'wss://eventsub.wss.twitch.tv/ws';

  public static sessionId: string = '';

  /**
   * Valid values are between 10 and 600
   */
  private static keepaliveTimeout: number = 10;

  private static keepaliveTimer: ReturnType<typeof setTimeout> | null = null;

  private static reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private static entries: Map<string, EventSubEntry> = new Map();

  private static reconnectUrl: string = '';

  private static isReconnecting: boolean = false;

  private static appStateSubscription: { remove: () => void } | null = null;

  // eslint-disable-next-line no-empty-function
  private constructor() {}

  public static getInstance(): WebSocket {
    if (
      !TwitchWsService.instance ||
      TwitchWsService.instance.readyState === WebSocket.CLOSED
    ) {
      TwitchWsService.connect();
    }

    return this.instance as WebSocket;
  }

  private static connect() {
    const wsUrl =
      TwitchWsService.isReconnecting && TwitchWsService.reconnectUrl
        ? TwitchWsService.reconnectUrl
        : TwitchWsService.url;

    TwitchWsService.instance = new WebSocket(wsUrl);
    TwitchWsService.setupEventListeners();
  }

  private static setupEventListeners() {
    if (!TwitchWsService.instance) {
      return;
    }

    TwitchWsService.instance.onopen = () => {
      logger.twitchWs.info('💜 twitch event sub WS connected');
      TwitchWsService.isReconnecting = false;
      logger.twitchWs.info('Twitch EventSub WebSocket connected', {
        name: 'twitch_ws_info',
        action: 'connected',
        provider: 'twitch',
        source: 'twitch_ws_service',
      });
    };

    /**
     * TODO: type more strictly
     */
    TwitchWsService.instance.onmessage = (event: MessageEvent) => {
      TwitchWsService.onMessage(event);
    };

    TwitchWsService.instance.onerror = error => {
      logger.twitchWs.warn('🟣 Twitch EventSub WebSocket error', {
        name: 'twitch_ws_warning',
        error,
        action: 'error',
        provider: 'twitch',
        source: 'twitch_ws_service',
      });
    };

    TwitchWsService.instance.onclose = event => {
      logger.twitchWs.warn(
        `🟣 Twitch EventSub WebSocket closed: ${event.code} - ${event.reason} - ${event.timeStamp}`,
      );
      if (event.code !== 1000) {
        logger.twitchWs.warn('Twitch EventSub WebSocket closed unexpectedly', {
          name: 'twitch_ws_warning',
          action: 'closed',
          code: event.code,
          provider: 'twitch',
          reason: event.reason,
          source: 'twitch_ws_service',
        });
      }
      TwitchWsService.clearKeepaliveTimer();

      if (event.code !== 1000 && !TwitchWsService.isReconnecting) {
        TwitchWsService.attemptReconnect();
      }
    };
  }

  /**
   * TODO: type MessageEvent better
   */
  private static onMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        event.data,
      ) as EventSubMessage;

      logger.twitchWs.debug(
        '🟣 EventSub message received:',
        message.metadata.message_type,
      );

      switch (message.metadata.message_type) {
        case 'session_welcome': {
          TwitchWsService.handleSessionWelcome(message);
          break;
        }

        case 'session_keepalive': {
          TwitchWsService.handleKeepAlive();
          break;
        }

        case 'notification': {
          TwitchWsService.handleNotification(message);
          break;
        }

        case 'session_reconnect': {
          TwitchWsService.handleReconnect(message);
          break;
        }

        case 'revocation': {
          TwitchWsService.handleRevocation(message);
          break;
        }

        default:
          logger.twitchWs.warn(
            '🟣 EventSub message not handle with type:',
            message.metadata.message_type,
          );
      }
    } catch (e) {
      logger.twitchWs.warn('Failed to parse Twitch EventSub message', {
        name: 'twitch_ws_warning',
        error: e,
        action: 'message_parse_failed',
        provider: 'twitch',
        source: 'twitch_ws_service',
      });
    }
  }

  private static handleSessionWelcome(message: EventSubMessage): void {
    const { session } = message.payload;

    if (!session) {
      logger.twitchWs.warn('🟣 No session found (handleSessionWelcome)');
      return;
    }

    TwitchWsService.sessionId = session.id;
    TwitchWsService.keepaliveTimeout = session.keepalive_timeout_seconds;

    logger.twitchWs.info(`🟣 EventSub session established: ${session.id}`);

    TwitchWsService.resetKeepaliveTimer();
    TwitchWsService.resubscribeToEvents();
  }

  private static handleKeepAlive(): void {
    logger.twitchWs.debug(`�� EventSub keepalive event received`);
    TwitchWsService.resetKeepaliveTimer();
  }

  private static handleNotification(message: EventSubMessage): void {
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

    const notifiedCondition = message.payload.subscription?.condition;
    const exactEntry = notifiedCondition
      ? TwitchWsService.entries.get(
          entryKey(subscriptionType, notifiedCondition),
        )
      : undefined;
    const targets = exactEntry
      ? [exactEntry]
      : TwitchWsService.entriesOfType(subscriptionType);

    for (const entry of targets) {
      for (const cb of entry.callbacks) {
        try {
          cb(message);
        } catch (e) {
          logger.twitchWs.error(
            `💜 error in event CB: ${JSON.stringify(e, null, 2)}`,
          );
        }
      }
    }

    TwitchWsService.resetKeepaliveTimer();
  }

  private static handleReconnect(message: EventSubMessage): void {
    const { session } = message.payload;

    if (!session?.reconnect_url) {
      logger.twitchWs.warn('💜 no reconnect_url set (handleReconnect)');
      return;
    }

    logger.twitchWs.info(
      '💜 EventSub reconnect required. Received URL',
      session.reconnect_url,
    );

    TwitchWsService.reconnectUrl = session.reconnect_url;
    TwitchWsService.isReconnecting = true;

    /**
     * TODO: we may need to emit or expose this so that we can
     * display a message in chat to say we're reconnecting
     */
    if (TwitchWsService.instance) {
      TwitchWsService.instance.close(1000, 'Reconnecting');
    }

    TwitchWsService.scheduleReconnect(1000);
  }

  private static handleRevocation(message: EventSubMessage): void {
    const { subscription } = message.payload;

    if (!subscription) {
      return;
    }

    logger.twitch.warn(
      `💜 EventSub subscription revoked: ${subscription.type}`,
    );
  }

  private static resetKeepaliveTimer(): void {
    TwitchWsService.clearKeepaliveTimer();

    const timeoutInMs = (TwitchWsService.keepaliveTimeout + 5) * 1000;

    TwitchWsService.keepaliveTimer = setTimeout(() => {
      logger.twitchWs.warn(
        `💜 EventSub keepalive timeout received - reconnecting`,
      );

      TwitchWsService.attemptReconnect();
    }, timeoutInMs);
  }

  private static clearKeepaliveTimer(): void {
    if (TwitchWsService.keepaliveTimer) {
      clearTimeout(TwitchWsService.keepaliveTimer);
      TwitchWsService.keepaliveTimer = null;
    }
  }

  private static clearReconnectTimer(): void {
    if (TwitchWsService.reconnectTimer) {
      clearTimeout(TwitchWsService.reconnectTimer);
      TwitchWsService.reconnectTimer = null;
    }
  }

  /**
   * Reconnects are always scheduled through here so a teardown can cancel one
   * mid-backoff. An uncancelled timer would otherwise reopen the socket, and
   * re-arm the keepalive, after every consumer has already gone away.
   */
  private static scheduleReconnect(delayMs: number): void {
    TwitchWsService.clearReconnectTimer();

    TwitchWsService.reconnectTimer = setTimeout(() => {
      TwitchWsService.reconnectTimer = null;

      if (!TwitchWsService.hasActiveListeners()) {
        TwitchWsService.isReconnecting = false;
        return;
      }

      TwitchWsService.connect();
    }, delayMs);
  }

  private static attemptReconnect(): void {
    if (TwitchWsService.isReconnecting) {
      return;
    }

    TwitchWsService.isReconnecting = true;

    logger.twitchWs.info(`💜 Attempting EventSub reconnection`);

    TwitchWsService.scheduleReconnect(2000);
  }

  private static entriesOfType(eventType: string): EventSubEntry[] {
    const matching: EventSubEntry[] = [];
    for (const entry of TwitchWsService.entries.values()) {
      if (entry.eventType === eventType) {
        matching.push(entry);
      }
    }
    return matching;
  }

  /**
   * Subscribe to an EventSub event type for one condition. Subscriptions are
   * identified by eventType + condition; the same type may be held for
   * several broadcasters at once during screen overlaps.
   */
  public static async subscribeToEvent(
    eventType: string,
    version: string,
    condition: Record<string, string>,
    callback: EventCallback,
  ): Promise<void> {
    const key = entryKey(eventType, condition);
    let entry = TwitchWsService.entries.get(key);
    if (!entry) {
      entry = {
        eventType,
        version,
        condition,
        callbacks: [],
        subscriptionId: null,
      };
      TwitchWsService.entries.set(key, entry);
    }
    if (!entry.callbacks.includes(callback)) {
      entry.callbacks.push(callback);
    }
    TwitchWsService.armForegroundRevive();

    if (!TwitchWsService.sessionId) {
      TwitchWsService.getInstance();
      logger.twitchWs.info(
        `💜 Delaying ${eventType} subscription until EventSub session is ready`,
      );
      return;
    }

    if (entry.subscriptionId) {
      return;
    }

    try {
      const response = await twitchService.createEventSubscription({
        type: eventType,
        version,
        condition,
        transport: {
          method: 'websocket',
          session_id: TwitchWsService.sessionId,
        },
      });

      if (!hasEventSubscriptionData(response)) {
        throw new Error(
          `Twitch EventSub ${eventType} subscription returned no subscription data`,
        );
      }

      const subscription = response.data[0];
      if (!subscription) {
        throw new Error(
          `Twitch EventSub ${eventType} subscription response was empty`,
        );
      }

      entry.subscriptionId = subscription.id;
      logger.twitchWs.info(
        `💜 Successfully subscribed to ${eventType} with ID: ${subscription.id}`,
      );
    } catch (error) {
      logger.twitchWs.warn(
        `Failed to subscribe to Twitch EventSub event ${eventType}`,
        {
          name: 'twitch_ws_warning',
          error,
          action: 'subscription_create_failed',
          event_type: eventType,
          provider: 'twitch',
          source: 'twitch_ws_service',
        },
      );
      const idx = entry.callbacks.indexOf(callback);
      if (idx > -1) {
        entry.callbacks.splice(idx, 1);
      }
      if (entry.callbacks.length === 0 && !entry.subscriptionId) {
        TwitchWsService.entries.delete(key);
      }
      TwitchWsService.teardownIfIdle();
    }
  }

  /**
   * Unsubscribe a callback from an event type. Without a callback, every
   * entry of the type is torn down; with one, only the entries holding that
   * callback are affected, so a sibling screen's subscription for another
   * broadcaster survives.
   */
  public static async unsubscribeFromEvent(
    eventType: string,
    callback?: EventCallback,
  ): Promise<void> {
    const matching: [string, EventSubEntry][] = [];
    for (const [key, entry] of TwitchWsService.entries) {
      if (entry.eventType !== eventType) {
        continue;
      }
      if (callback && !entry.callbacks.includes(callback)) {
        continue;
      }
      matching.push([key, entry]);
    }

    if (matching.length === 0) {
      TwitchWsService.teardownIfIdle();
      return;
    }

    for (const [key, entry] of matching) {
      if (callback) {
        const idx = entry.callbacks.indexOf(callback);
        if (idx > -1) {
          entry.callbacks.splice(idx, 1);
        }
        if (entry.callbacks.length > 0) {
          continue;
        }
      } else {
        entry.callbacks = [];
      }

      // Claim the entry before awaiting. The hooks unsubscribe several event
      // types through one Promise.all, so a sibling that settles first can
      // reach teardownIfIdle -> cleanupSubscriptions while this delete is
      // still in flight, and would otherwise delete the same id a second time.
      TwitchWsService.entries.delete(key);
      const subscriptionId = entry.subscriptionId;

      if (!subscriptionId) {
        TwitchWsService.teardownIfIdle();
        continue;
      }

      try {
        await twitchService.deleteEventSubscription(subscriptionId);

        logger.twitchWs.info(
          `💜 Successfully unsubscribed from ${eventType} (ID: ${subscriptionId})`,
        );
      } catch (error) {
        logger.twitchWs.warn(
          `Failed to unsubscribe from Twitch EventSub event ${eventType}`,
          {
            name: 'twitch_ws_warning',
            error,
            action: 'subscription_delete_failed',
            event_type: eventType,
            provider: 'twitch',
            source: 'twitch_ws_service',
            subscription_id: subscriptionId,
          },
        );
      } finally {
        TwitchWsService.teardownIfIdle();
      }
    }
  }

  /**
   * Re-subscribe to events after reconnection
   */
  private static resubscribeToEvents(): void {
    const entries = Array.from(TwitchWsService.entries.values());

    if (entries.length === 0) {
      return;
    }

    logger.twitchWs.info(
      `💜 Re-subscribing to ${entries.length} subscriptions`,
    );

    // Clear old subscription IDs since we have a new session
    for (const entry of entries) {
      entry.subscriptionId = null;
    }

    entries.forEach(entry => {
      const firstCallback = entry.callbacks[0];
      if (firstCallback) {
        void TwitchWsService.subscribeToEvent(
          entry.eventType,
          entry.version,
          entry.condition,
          firstCallback,
        );
      }
    });
  }

  /**
   * Get all active subscriptions from Twitch API
   */
  public static async getActiveSubscriptions(): Promise<void> {
    try {
      const response = await twitchService.listEventSubscriptions({
        status: 'enabled',
      });

      if (!hasEventSubscriptionData(response)) {
        throw new Error(
          'Twitch EventSub active subscriptions returned no subscription data',
        );
      }

      logger.twitchWs.info(
        `💜 Found ${response.data.length} active subscriptions`,
        response.data.map(sub => ({ type: sub.type, id: sub.id })),
      );

      const subscriptions = response.data as EventSubscriptionSummary[];
      subscriptions.forEach(subscription => {
        if (subscription.transport.session_id !== TwitchWsService.sessionId) {
          return;
        }
        const entry = subscription.condition
          ? TwitchWsService.entries.get(
              entryKey(subscription.type, subscription.condition),
            )
          : TwitchWsService.entriesOfType(subscription.type)[0];
        if (entry) {
          entry.subscriptionId = subscription.id;
        }
      });
    } catch (error) {
      logger.twitchWs.warn(
        'Failed to fetch active Twitch EventSub subscriptions',
        {
          name: 'twitch_ws_warning',
          error,
          action: 'active_subscriptions_fetch_failed',
          provider: 'twitch',
          source: 'twitch_ws_service',
        },
      );
    }
  }

  /**
   * Clean up all subscriptions when disconnecting
   */
  public static async cleanupSubscriptions(): Promise<void> {
    const subscriptionIds: string[] = [];
    for (const [key, entry] of TwitchWsService.entries) {
      if (entry.subscriptionId) {
        subscriptionIds.push(entry.subscriptionId);
        entry.subscriptionId = null;
      }
      if (entry.callbacks.length === 0) {
        TwitchWsService.entries.delete(key);
      }
    }

    if (subscriptionIds.length === 0) {
      return;
    }

    logger.twitchWs.info(
      `💜 Cleaning up ${subscriptionIds.length} subscriptions in background`,
    );

    const cleanupTimeout = new Promise<void>(resolve => {
      setTimeout(() => {
        logger.twitchWs.warn(
          '💜 Subscription cleanup timed out, continuing...',
        );
        resolve();
      }, 5000);
    });

    const cleanupPromises = subscriptionIds.map(subscriptionId =>
      (async () => {
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
            `Failed to clean up Twitch EventSub subscription ${subscriptionId}`,
            {
              name: 'twitch_ws_warning',
              error,
              action: 'subscription_cleanup_failed',
              provider: 'twitch',
              source: 'twitch_ws_service',
              subscription_id: subscriptionId,
            },
          );
        }
      })(),
    );

    await Promise.race([Promise.allSettled(cleanupPromises), cleanupTimeout]);
  }

  private static hasActiveListeners(): boolean {
    for (const entry of TwitchWsService.entries.values()) {
      if (entry.callbacks.length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * iOS suspends the socket and every timer in the background, so the
   * keepalive watchdog cannot be the only recovery path: after a long
   * suspension the app can foreground with dead feeds and no timer left to
   * notice. Reviving on foreground mirrors the IRC and 7TV sockets.
   */
  private static armForegroundRevive(): void {
    if (TwitchWsService.appStateSubscription) {
      return;
    }

    TwitchWsService.appStateSubscription = AppState.addEventListener(
      'change',
      state => {
        if (state !== 'active') {
          return;
        }
        if (
          !TwitchWsService.hasActiveListeners() ||
          TwitchWsService.isConnected()
        ) {
          return;
        }

        logger.twitchWs.info(
          '💜 Reviving EventSub socket after returning to foreground',
        );
        TwitchWsService.reconnectUrl = '';
        TwitchWsService.isReconnecting = false;
        TwitchWsService.sessionId = '';
        TwitchWsService.scheduleReconnect(0);
      },
    );
  }

  private static disarmForegroundRevive(): void {
    TwitchWsService.appStateSubscription?.remove();
    TwitchWsService.appStateSubscription = null;
  }

  /**
   * Polls, predictions and channel-point redemptions share one EventSub socket,
   * so the listener registry is the refcount: the socket closes only once the
   * last consumer has unsubscribed. Closing on any one consumer's unmount would
   * silently kill the feeds the others are still mounted on.
   */
  private static teardownIfIdle(): void {
    if (TwitchWsService.hasActiveListeners()) {
      return;
    }

    TwitchWsService.clearKeepaliveTimer();
    TwitchWsService.clearReconnectTimer();
    TwitchWsService.disarmForegroundRevive();
    TwitchWsService.isReconnecting = false;

    // Close WebSocket immediately for fast disconnection
    if (TwitchWsService.instance) {
      TwitchWsService.instance.close(1000, 'Manual Disconnect');
      TwitchWsService.instance = null;
      TwitchWsService.sessionId = '';
    }

    // Clean up subscriptions in background without blocking disconnection
    void TwitchWsService.cleanupSubscriptions();
  }

  public static isConnected(): boolean {
    return (
      TwitchWsService.instance?.readyState === WebSocket.OPEN &&
      !!TwitchWsService.sessionId
    );
  }
}
export default TwitchWsService;
