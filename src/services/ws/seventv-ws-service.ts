/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import { logger } from '@app/utils/logger';
import { StvUser, SevenTvEmote, SanitisiedEmoteSet } from '../seventv-service';

interface SevenTvWsBody {
  id: string;
  kind: number;
  contextual?: boolean;
  actor?: StvUser;
  pulled?: { [key: string]: SevenTvPulled };
  pushed?: SevenTvPushed[];
}

interface SevenTvPulled {
  key: string;
  index: number;
  old_value: SevenTvEmote & { origin_id: string | null };
  value: null;
  op: 0;
  t: number;
  s: number;
}

interface SevenTvPushed {
  key: string;
  index: number;
  type: string;
  value: SevenTvEmote & { origin_id: string | null };
  op: 0;
  t: number;
  s: number;
}

type SevenTvEmoteSetEvents =
  /**
   * Emote set has been created
   */
  | 'emote_set.create'

  /**
   * Emote set has been updated
   */
  | 'emote_set.update'

  /**
   * Emote set has been deleted
   */
  | 'emote_set.delete'

  /**
   * Subscribe to all emote set events
   */
  | 'emote_set.*';

type SevenTvEmoteEvents =
  /**
   * Emote has been created
   */
  | 'emote.create'

  /**
   * Emote has been updated (i.e. renamed)
   */
  | 'emote.update'

  /**
   * Emote has been deleted from the set
   */
  | 'emote.delete'

  /**
   * Subscribe to all emote events
   */
  | 'emote.*';

type SevenTvCosmeticEvents =
  /**
   * Cosmetic has been created
   */
  | 'cosmetic.create'

  /**
   * Cosmetic has been updated
   */
  | 'cosmetic.update'
  /**
   * Cosmetic has been deleted
   */
  | 'cosmetic.delete'

  /**
   * Subscribe to all cosmetic events
   */
  | 'cosmetic.*';

type SevenTvUserEvents =
  /**
   * User has been created
   */
  | 'user.create'

  /**
   * User has been updated
   */
  | 'user.update'

  /**
   * User has been deleted
   */
  | 'user.delete'

  /**
   * Subscribe to all user events
   */
  | 'user.*';

type SevenTvUserEntitlementEvents =
  /**
   * Entitlement has been created
   */
  | 'entitlement.create'
  /**
   * Entitlement has been updated
   */
  | 'entitlement.update'

  /**
   * Entitlement has been deleted
   */
  | 'entitlement.delete'

  /**
   * Subscribe to all entitlement events
   */
  | 'entitlement.*';

type SevenTvEventType =
  | SevenTvEmoteSetEvents
  | SevenTvEmoteEvents
  | SevenTvCosmeticEvents
  | SevenTvUserEvents
  | SevenTvUserEntitlementEvents;

export interface SevenTvEventData {
  type: SevenTvEventType;
  body: SevenTvWsBody;
}

/**
 * Generic WebSocket message type for SevenTV
 */
export type SevenTvWsMessage<TData = unknown, TEventType = SevenTvEventType> =
  /**
   * Dispatch - event data
   * A standard event message, sent when a subscribed event is emitted
   */
  | {
      op: 0;
      d: TData;
    }
  /**
   * Hello
   * Received upon connecting, presents info about the session
   */
  | {
      op: 1;
      d?: {
        /**
         * interval in milliseconds between each heartbeat
         */
        heartbeat_interval: number;
        /**
         * unique token for this session, used for resuming and mutating the session
         */
        session_id: string;
        /**
         * the maximum amount of subscriptions this connection can initiate
         */
        subscription_limit: number;
        instance: {
          /**
           * @example 'event-api-1'
           */
          name: string;
          population: number;
        };
      };
      t?: number;
      s?: number;
    }
  /**
   * Heartbeat - Ensures the connection is still alive
   */
  | {
      op: 2;
      d: {
        /**
         * The amount of heartbeats so far
         */
        count: number;
      };
      t: number;
      s: number;
    }
  /**
   * Reconnect - Server wants the client to reconnect
   */
  | {
      op: 4;
    }
  /**
   * ACK
   */
  | {
      op: 5;
      d: {
        /**
         * the acknowledged sent opcode in text form
         */
        command: string;
        /**
         * the data sent by the client
         */
        data: string;
      };
      t: number;
      s: number;
    }

  /**
   * Invalid Subscription Condition
   */
  | {
      op: 6;
      d: {
        code: number;
        message: string;
      };
      t: number;
      s: number;
    }
  /**
   * Resume the previous connection
   */
  | {
      op: 34;
      d: {
        /**
         * the id of the previous session
         */
        session_id: string;
      };
      t: number;
      s: number;
    }

  /**
   * Server requesting connection / end of stream
   * End of Stream events are sent when the connection is closed by the server.
   * The close code provided in the event indicates the reason for the disconnect and whether or not the client should reconnect.
   */
  | {
      op: 7;
      d?: {
        code: number;

        /**
         * A text message about the closure
         */
        message: string;
      };
      t?: never;
      s?: never;
    }
  /**
   * Subscribe to an event
   */
  | {
      op: 35;
      d: {
        type: TEventType;
        condition: TEventType extends 'entitlement.create'
          ? {
              /**
               * valid fields in the condition depend on the subscription type
               * though in most cases except creations, object_id is acceptable
               * to filter for a specific object.
               */
              platform?: 'TWITCH';
              ctx?: 'channel';
              id?: string;
            }
          : {
              object_id: string;
            };
      };
      t?: number;
      s?: never;
    }
  /**
   * Unsubscribe from an event
   */
  | {
      op: 36;
      d: {
        type: TEventType;
        condition: {
          object_id: string;
        };
      };
    };

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class SevenTvWsService {
  private static instance: WebSocket | null = null;

  private static url: string = 'wss://events.7tv.io/v3';

  private static isReconnecting: boolean = false;

  private static reconnectAttempts: number = 0;

  private static maxReconnectAttempts: number = 5;

  private static reconnectDelay: number = 1000;

  private static currentEmoteSetId: string | undefined = undefined;

  private static twitchChannelId: string | undefined = undefined;

  private static sevenTVemoteSetId: string | undefined = undefined;

  private static hasInitialSubscriptions: boolean = false;

  /**
   * Timeout for waiting for IDs to be set (in milliseconds)
   */
  private static readonly ID_WAIT_TIMEOUT: number = 30000; // 30 seconds

  /**
   * Callback for emote updates
   */
  private static emoteUpdateCallback:
    | ((data: {
        added: SanitisiedEmoteSet[];
        removed: SanitisiedEmoteSet[];
        channelId: string;
      }) => void)
    | null = null;

  // eslint-disable-next-line no-empty-function
  private constructor() {}

  public static getInstance(): WebSocket {
    if (
      !SevenTvWsService.instance ||
      SevenTvWsService.instance.readyState === WebSocket.CLOSED
    ) {
      SevenTvWsService.connect();
    }

    return this.instance as WebSocket;
  }

  private static connect() {
    if (
      SevenTvWsService.instance &&
      SevenTvWsService.instance.readyState === WebSocket.CONNECTING
    ) {
      logger.stvWs.debug('💚 Connection already in progress, skipping...');
      return;
    }

    try {
      SevenTvWsService.instance = new WebSocket(this.url);
      SevenTvWsService.setupEventListeners();
    } catch (e) {
      logger.stvWs.error(
        `💙 Failed to create SevenTV WS connection: ${JSON.stringify(e, null, 2)}`,
      );

      SevenTvWsService.attemptReconnect();
    }
  }

  private static setupEventListeners() {
    if (!SevenTvWsService.instance) {
      return;
    }

    SevenTvWsService.instance.onopen = async () => {
      logger.stvWs.info('💚 SevenTV WebSocket connected');
      SevenTvWsService.isReconnecting = false;
      SevenTvWsService.reconnectAttempts = 0;

      if (!SevenTvWsService.hasInitialSubscriptions) {
        await SevenTvWsService.setupInitialSubscriptions();
        SevenTvWsService.hasInitialSubscriptions = true;
      }

      logger.stvWs.info('💚 SevenTV WebSocket setup complete');
    };

    SevenTvWsService.instance.onmessage = (event: MessageEvent) => {
      SevenTvWsService.onMessage(event);
    };

    SevenTvWsService.instance.onerror = error => {
      logger.stvWs.error(
        `💚 SevenTv WS error: ${JSON.stringify(error, null, 2)}`,
      );
    };

    SevenTvWsService.instance.onclose = event => {
      logger.stv.warn(
        `🟢 SevenTV WebSocket closed: ${event.code} - ${event.reason}`,
      );

      SevenTvWsService.hasInitialSubscriptions = false;

      if (event.code !== 1000 && !SevenTvWsService.isReconnecting) {
        SevenTvWsService.attemptReconnect();
      }
    };
  }

  private static onMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(
        event.data as string,
      ) as SevenTvWsMessage<SevenTvEventData>;

      switch (message.op) {
        case 0: {
          switch (message.d.type) {
            case 'emote_set.update': {
              logger.stvWs.info(`💚 Received WS 'emote_set.update' event`);
              SevenTvWsService.handleEmoteSetUpdate(message.d);
              break;
            }

            default: {
              logger.stvWs.info(
                `💚 Received WS unhandled data event: ${message.d.type}`,
              );
              break;
            }
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
          SevenTvWsService.attemptReconnect();
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
  }

  private static handleEmoteSetUpdate(data: SevenTvEventData): void {
    try {
      logger.stvWs.info('data', data);

      const addedEmotes: SanitisiedEmoteSet[] = [];
      const removedEmotes: SanitisiedEmoteSet[] = [];

      /**
       * New emotes have been added to the set
       */
      if (data.body.pushed) {
        data.body.pushed.forEach(emote => {
          const emote4x =
            emote.value.data.host.files.find(file => file.name === '4x.avif') ||
            emote.value.data.host.files.find(file => file.name === '3x.avif') ||
            emote.value.data.host.files.find(file => file.name === '2x.avif') ||
            emote.value.data.host.files.find(file => file.name === '1x.avif');

          addedEmotes.push({
            name: emote.value.name,
            id: emote.value.id,
            url: `https://cdn.7tv.app/emote/${emote.value.id}/${emote4x?.name ?? '1x.avif'}`,
            flags: emote.value.data.flags,
            original_name: emote.value.data.name,
            creator:
              (emote.value.data.owner?.display_name ||
                emote.value.data.owner?.username) ??
              'UNKNOWN',
            emote_link: `https://7tv.app/emotes/${emote.value.id}`,
            site: '7TV Channel Emote',
            height: emote4x?.height,
            width: emote4x?.width,
            actor: data.body.actor,
          });
        });
      }

      if (data.body.pulled) {
        console.log('actor is ->', data.body.actor?.display_name);

        Object.values(data.body.pulled).forEach(emote => {
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
              actor: data.body.actor,
            });
          }
        });
      }

      if (addedEmotes.length > 0 || removedEmotes.length > 0) {
        logger.stvWs.info(
          `💚 Processing emote set update: +${addedEmotes.length} -${removedEmotes.length} emotes`,
        );

        /**
         * Fire callback so we can update the emote set
         * in our context
         */
        if (SevenTvWsService.emoteUpdateCallback) {
          SevenTvWsService.emoteUpdateCallback({
            added: addedEmotes,
            removed: removedEmotes,
            channelId: SevenTvWsService.twitchChannelId || '',
          });
        }
      }
    } catch (error) {
      logger.stvWs.error('Error handling emote set update:', error);
    }
  }

  private static attemptReconnect() {
    if (SevenTvWsService.isReconnecting) {
      return;
    }

    if (
      SevenTvWsService.reconnectAttempts >=
      SevenTvWsService.maxReconnectAttempts
    ) {
      logger.stv.error(
        '🟢 Max SevenTV reconnection attempts reached. Giving up.',
      );
      return;
    }

    SevenTvWsService.isReconnecting = true;
    SevenTvWsService.reconnectAttempts += 1;

    const delay =
      SevenTvWsService.reconnectDelay * SevenTvWsService.reconnectAttempts;

    logger.stvWs.warn(
      `💚 Attempting STV WS reconnection (${SevenTvWsService.reconnectAttempts}/${SevenTvWsService.maxReconnectAttempts}) in ${delay}ms`,
    );

    setTimeout(() => {
      SevenTvWsService.connect();
    }, delay);
  }

  /**
   * Set up initial subscriptions (entitlement and emote set)
   */
  private static async setupInitialSubscriptions(): Promise<void> {
    if (
      !SevenTvWsService.instance ||
      SevenTvWsService.instance.readyState !== WebSocket.OPEN
    ) {
      logger.stvWs.warn(
        '💚 Cannot setup subscriptions - WebSocket not connected',
      );
      return;
    }

    let waitStartTime = Date.now();

    // Wait for twitchChannelId to be set
    while (
      SevenTvWsService.twitchChannelId === undefined &&
      Date.now() - waitStartTime < SevenTvWsService.ID_WAIT_TIMEOUT
    ) {
      logger.stvWs.debug('💚 Waiting for twitchChannelId to be set...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Subscribe to entitlement.create events if twitchChannelId is available
    if (SevenTvWsService.twitchChannelId) {
      const subscribeEntitlementCreateMessage: SevenTvWsMessage<
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
            id: SevenTvWsService.twitchChannelId,
          },
        },
      };

      SevenTvWsService.instance.send(
        JSON.stringify(subscribeEntitlementCreateMessage),
      );

      logger.stvWs.info('💚 Subscribed to entitlement.create events');
    }

    // Reset wait timer for next set of IDs
    waitStartTime = Date.now();

    // Wait for sevenTVemoteSetId to be set
    while (
      SevenTvWsService.sevenTVemoteSetId === undefined &&
      Date.now() - waitStartTime < SevenTvWsService.ID_WAIT_TIMEOUT
    ) {
      logger.stvWs.debug('💚 Waiting for sevenTVemoteSetId to be set...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (SevenTvWsService.sevenTVemoteSetId) {
      const subscribeEmoteSetMessage: SevenTvWsMessage<
        never,
        'emote_set.update'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'emote_set.update',
          condition: {
            object_id: SevenTvWsService.sevenTVemoteSetId,
          },
        },
      };

      SevenTvWsService.instance.send(JSON.stringify(subscribeEmoteSetMessage));
      logger.stvWs.info('💚 Subscribed to emote_set.update events');
    }
  }

  /**
   * Send subscription payload for a specific emote set
   */
  private static sendSubscription(emoteSetId: string): void {
    logger.stvWs.info(`💚 Attempting to subscribe to emote set: ${emoteSetId}`);

    if (!SevenTvWsService.isConnected()) {
      logger.stvWs.warn(
        '💚 Cannot subscribe - SevenTV WebSocket not connected',
      );
      return;
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

    const emoteUpdatesSubscriptionMessage: SevenTvWsMessage<
      never,
      'emote.update'
    > = {
      op: 35,
      d: {
        type: 'emote.update',
        condition: {
          object_id: emoteSetId,
        },
      },
    };

    const entitlementSubscriptionMessage: SevenTvWsMessage<
      never,
      'entitlement.create'
    > = {
      op: 35,
      t: parseInt(new Date().getTime().toString(), 10),
      d: {
        type: 'entitlement.create',
        condition: {
          id: SevenTvWsService.twitchChannelId,
          platform: 'TWITCH',
          ctx: 'channel',
        },
      },
    };

    try {
      if (SevenTvWsService.twitchChannelId) {
        SevenTvWsService.instance?.send(
          JSON.stringify(entitlementSubscriptionMessage),
        );
      }

      SevenTvWsService.instance?.send(
        JSON.stringify(emoteSetSubscriptionMessage),
      );

      SevenTvWsService.instance?.send(
        JSON.stringify(emoteUpdatesSubscriptionMessage),
      );

      logger.stvWs.info(
        `✅ Successfully sent subscription for emote set: ${emoteSetId}`,
      );
    } catch (e) {
      logger.stvWs.error(
        `❌ Failed to subscribe to STV emote set: ${emoteSetId} - error: ${JSON.stringify(e, null, 2)}`,
      );
    }
  }

  /**
   * Unsubscribe from a specific emote set
   */
  private static unsubscribeFromEmoteSet(emoteSetId: string): void {
    const unsubscribeMessage: SevenTvWsMessage<never, 'emote_set.update'> = {
      op: 36,
      d: {
        type: 'emote_set.update',
        condition: {
          object_id: emoteSetId,
        },
      },
    };

    try {
      SevenTvWsService.instance?.send(JSON.stringify(unsubscribeMessage));
      logger.stvWs.info(`💚 Unsubscribed from STV emote set: ${emoteSetId}`);
    } catch (e) {
      logger.stvWs.error(
        `Failed to unsubscribe from STV emote set: ${emoteSetId} - error: ${JSON.stringify(e, null, 2)}`,
      );
    }
  }

  /**
   * Subscribe to a channel's emote set
   */
  public static subscribeToChannel(emoteSetId: string): void {
    if (
      SevenTvWsService.currentEmoteSetId &&
      SevenTvWsService.currentEmoteSetId !== emoteSetId
    ) {
      SevenTvWsService.unsubscribeFromEmoteSet(
        SevenTvWsService.currentEmoteSetId,
      );
    }

    this.currentEmoteSetId = emoteSetId;

    if (SevenTvWsService.isConnected() && emoteSetId) {
      SevenTvWsService.sendSubscription(emoteSetId);
    }

    logger.stvWs.info(`💚 Set current emote set: ${emoteSetId}`);
  }

  /**
   * Unsubscribe from current channel's emote set
   */
  public static unsubscribeFromChannel(): void {
    if (SevenTvWsService.currentEmoteSetId && SevenTvWsService.isConnected()) {
      SevenTvWsService.unsubscribeFromEmoteSet(
        SevenTvWsService.currentEmoteSetId,
      );
    }

    SevenTvWsService.currentEmoteSetId = '';
    logger.stvWs.info('💚 Cleared current emote set');
  }

  /**
   * Set the emote update callback
   */
  public static setEmoteUpdateCallback(
    callback:
      | ((data: {
          added: SanitisiedEmoteSet[];
          removed: SanitisiedEmoteSet[];
          channelId: string;
        }) => void)
      | null,
  ): void {
    SevenTvWsService.emoteUpdateCallback = callback;
  }

  /**
   * Remove event listener for a given channel
   */
  public static disconnect(): void {
    if (SevenTvWsService.instance) {
      SevenTvWsService.instance.close(1000, 'Manual Disconnect');
      SevenTvWsService.instance = null;
      SevenTvWsService.isReconnecting = false;
      SevenTvWsService.reconnectAttempts = 0;
      SevenTvWsService.currentEmoteSetId = '';
      SevenTvWsService.twitchChannelId = '';
      SevenTvWsService.sevenTVemoteSetId = '';
      SevenTvWsService.hasInitialSubscriptions = false;
      SevenTvWsService.emoteUpdateCallback = null;
      logger.stvWs.info('🟢 SevenTV WebSocket disconnected');
    }
  }

  public static isConnected(): boolean {
    return SevenTvWsService.instance?.readyState === WebSocket.OPEN;
  }

  public static getConnectionState():
    | 'DISCONNECTED'
    | 'CONNECTING'
    | 'CONNECTED'
    | 'CLOSING'
    | 'CLOSED'
    | 'UNKNOWN' {
    if (!SevenTvWsService.instance) {
      return 'DISCONNECTED';
    }

    switch (SevenTvWsService.instance.readyState) {
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
  }

  /**
   * Set the Twitch channel ID for entitlement subscriptions
   */
  public static setTwitchChannelId(channelId: string): void {
    SevenTvWsService.twitchChannelId = channelId;
    logger.stvWs.info(`💚 Set Twitch channel ID: ${channelId}`);
  }

  /**
   * Set the SevenTV emote set ID for emote set subscriptions
   */
  public static setSevenTVemoteSetId(emoteSetId: string): void {
    SevenTvWsService.sevenTVemoteSetId = emoteSetId;
    logger.stvWs.info(`💚 Set SevenTV emote set ID: ${emoteSetId}`);
  }
}
