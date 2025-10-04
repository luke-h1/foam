import { logger } from '@app/utils/logger';
import { twitchService } from './twitch-service';

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

/**
 * TODO: make more precise with generic and discriminated unions
 */
interface EventSubMessage {
  metadata: EventSubMetadata;
  payload: EventSubPayload;
  event?: Record<string, unknown>;
}

type EventCallback = (data: EventSubMessage) => void;

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

  private static sessionId: string = '';

  /**
   * Valid values are between 10 and 600
   */
  private static keepaliveTimeout: number = 10;

  // eslint-disable-next-line no-undef
  private static keepaliveTimer: NodeJS.Timeout | null = null;

  private static eventCallbacks: Map<string, EventCallback[]> = new Map();

  private static reconnectUrl: string = '';

  private static isReconnecting: boolean = false;

  private static activeSubscriptions: Map<string, string> = new Map(); // eventType -> subscriptionId

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
    };

    /**
     * TODO: type more strictly
     */
    TwitchWsService.instance.onmessage = (event: MessageEvent) => {
      TwitchWsService.onMessage(event);
    };

    TwitchWsService.instance.onerror = error => {
      logger.twitchWs.error('🟣 Twitch EventSub WebSocket error:', error);
    };

    TwitchWsService.instance.onclose = event => {
      logger.twitchWs.warn(
        `🟣 Twitch EventSub WebSocket closed: ${event.code} - ${event.reason} - ${event.timeStamp}`,
      );
      TwitchWsService.clearKeepaliveTimer();

      /**
       * Attempt to reconnect if its not a normal closure
       */
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
      logger.twitchWs.error('🟣 Failed to parse EventSub message:', e);
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

    /**
     * Reset and begin keep alive monitoring
     */
    TwitchWsService.resetKeepaliveTimer();

    /**
     * Re-subscribe to any events that had callbacks registered
     */
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

    /**
     * Trigger any registered callbacks
     */
    const callbacks = TwitchWsService.eventCallbacks.get(subscriptionType);

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

    /**
     * Reset keep-alive timer
     */
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
     * Close the current connection and re-connect
     * TODO: we may need to emit or expose this so that we can
     * display a message in chat to say we're reconnecting
     */
    if (TwitchWsService.instance) {
      TwitchWsService.instance.close(1000, 'Reconnecting');
    }

    setTimeout(() => {
      TwitchWsService.connect();
    }, 1000);
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

    const timeoutInMs = (TwitchWsService.keepaliveTimeout + 5) * 1000; // 5s

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

  private static attemptReconnect(): void {
    if (TwitchWsService.isReconnecting) {
      return;
    }

    TwitchWsService.isReconnecting = true;

    logger.twitchWs.info(`💜 Attempting EventSub reconnection`);

    setTimeout(() => {
      TwitchWsService.connect();
    }, 2000);
  }

  /**
   * Subscribe to an EventSub event type
   */
  public static async subscribeToEvent(
    eventType: string,
    version: string,
    condition: Record<string, string>,
    callback: EventCallback,
  ): Promise<void> {
    if (!TwitchWsService.sessionId) {
      logger.twitchWs.warn('💜 Cannot subscribe - no active session');
      return;
    }

    // Add callback first
    TwitchWsService.addEventListener(eventType, callback);

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

      const subscription = response.data[0];
      if (subscription) {
        TwitchWsService.activeSubscriptions.set(eventType, subscription.id);
        logger.twitchWs.info(
          `💜 Successfully subscribed to ${eventType} with ID: ${subscription.id}`,
        );
      }
    } catch (error) {
      logger.twitchWs.error(`💜 Failed to subscribe to ${eventType}:`, error);
      // Remove the callback if subscription failed
      TwitchWsService.removeEventListener(eventType, callback);
    }
  }

  /**
   * Unsubscribe from an EventSub event type
   */
  public static async unsubscribeFromEvent(
    eventType: string,
    callback?: EventCallback,
  ): Promise<void> {
    const subscriptionId = TwitchWsService.activeSubscriptions.get(eventType);

    if (!subscriptionId) {
      logger.twitchWs.warn(`💜 No active subscription found for ${eventType}`);
      return;
    }

    try {
      await twitchService.deleteEventSubscription(subscriptionId);
      TwitchWsService.activeSubscriptions.delete(eventType);

      if (callback) {
        TwitchWsService.removeEventListener(eventType, callback);
      } else {
        // Remove all callbacks for this event type
        TwitchWsService.eventCallbacks.delete(eventType);
      }

      logger.twitchWs.info(
        `💜 Successfully unsubscribed from ${eventType} (ID: ${subscriptionId})`,
      );
    } catch (error) {
      logger.twitchWs.error(
        `💜 Failed to unsubscribe from ${eventType}:`,
        error,
      );
    }
  }

  /**
   * Re-subscribe to events after reconnection
   */
  private static resubscribeToEvents(): void {
    const eventTypes = Array.from(TwitchWsService.eventCallbacks.keys());

    if (eventTypes.length === 0) {
      return;
    }

    logger.twitchWs.info(
      `💜 Re-subscribing to ${eventTypes.length} event types`,
    );

    // Clear old subscription IDs since we have a new session
    TwitchWsService.activeSubscriptions.clear();

    eventTypes.forEach(eventType => {
      const callbacks = TwitchWsService.eventCallbacks.get(eventType);
      if (callbacks && callbacks.length > 0) {
        // For now, we'll need the caller to provide version and condition
        // This is a limitation that could be improved by storing subscription metadata
        logger.twitchWs.warn(
          `💜 Cannot auto-resubscribe to ${eventType} - need version and condition info`,
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

      logger.twitchWs.info(
        `💜 Found ${response.data.length} active subscriptions`,
        response.data.map(sub => ({ type: sub.type, id: sub.id })),
      );

      // Update our local tracking
      response.data.forEach(subscription => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (subscription.transport.session_id === TwitchWsService.sessionId) {
          TwitchWsService.activeSubscriptions.set(
            subscription.type,
            subscription.id,
          );
        }
      });
    } catch (error) {
      logger.twitchWs.error('💜 Failed to fetch active subscriptions:', error);
    }
  }

  /**
   * Clean up all subscriptions when disconnecting
   */
  public static async cleanupSubscriptions(): Promise<void> {
    const subscriptionIds = Array.from(
      TwitchWsService.activeSubscriptions.values(),
    );

    if (subscriptionIds.length === 0) {
      return;
    }

    logger.twitchWs.info(
      `💜 Cleaning up ${subscriptionIds.length} subscriptions`,
    );

    const cleanupPromises = subscriptionIds.map(async subscriptionId => {
      try {
        await twitchService.deleteEventSubscription(subscriptionId);
        logger.twitchWs.info(`💜 Cleaned up subscription: ${subscriptionId}`);
      } catch (error) {
        logger.twitchWs.error(
          `💜 Failed to cleanup subscription ${subscriptionId}:`,
          error,
        );
      }
    });

    await Promise.allSettled(cleanupPromises);
    TwitchWsService.activeSubscriptions.clear();
  }

  public get sessionId(): string {
    return this.sessionId;
  }

  /**
   * Todo: tighten types
   */
  public static addEventListener(
    eventType: string,
    callback: EventCallback,
  ): void {
    if (!TwitchWsService.eventCallbacks.has(eventType)) {
      TwitchWsService.eventCallbacks.set(eventType, []);
    }

    TwitchWsService.eventCallbacks.get(eventType)?.push(callback);
    logger.twitchWs.info(`💜 Added event listener for ${eventType}`);
  }

  public static removeEventListener(
    eventType: string,
    callback: EventCallback,
  ): void {
    const callbacks = TwitchWsService.eventCallbacks.get(eventType);

    if (callbacks) {
      const idx = callbacks.indexOf(callback);

      if (idx > -1) {
        callbacks.splice(idx, 1);
      }
    }
  }

  public static disconnect() {
    TwitchWsService.clearKeepaliveTimer();

    void TwitchWsService.cleanupSubscriptions();

    if (TwitchWsService.instance) {
      TwitchWsService.instance.close(1000, 'Manual Disconnect');
      TwitchWsService.instance = null;
      TwitchWsService.sessionId = '';
      TwitchWsService.isReconnecting = false;
      TwitchWsService.activeSubscriptions.clear();
    }
  }

  public static isConnected(): boolean {
    return (
      TwitchWsService.instance?.readyState === WebSocket.OPEN &&
      !!TwitchWsService.sessionId
    );
  }
}
export default TwitchWsService;
