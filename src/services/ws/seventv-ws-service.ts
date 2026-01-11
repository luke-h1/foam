/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import { CosmeticCreateCallbackData } from '@app/hooks/useSeventvWs';
import { logger } from '@app/utils/logger';
import {
  StvUser,
  SevenTvEmote,
  SanitisiedEmoteSet,
  SevenTvHost,
} from '../seventv-service';

interface EventObject {
  id: string;
  name: string;
}

/**
 * {
  "id": "01KDREVNA4XVTD3G04PWWDQMGF",
  "kind": 10,
  "object": {
    "id": "01KDREVNA4XVTD3G04PWWDQMGF",
    "kind": "PAINT",
    "data": {
      "id": "01KDREVNA4XVTD3G04PWWDQMGF",
      "name": "Northern Light",
      "color": null,
      "gradients": {
        "length": 0
      },
      "shadows": {
        "0": {
          "x_offset": 0,
          "y_offset": 0,
          "radius": 0.1,
          "color": 2096885247
        },
        "length": 1
      },
      "text": null,
      "function": "LINEAR_GRADIENT",
      "repeat": false,
      "angle": 45,
      "shape": "circle",
      "image_url": "",
      "stops": {
        "0": {
          "at": 0,
          "color": -1675056641
        },
        "1": {
          "at": 0.2,
          "color": -279117825
        },
        "2": {
          "at": 0.4,
          "color": 1560255231
        },
        "3": {
          "at": 0.6,
          "color": 1308618239
        },
        "4": {
          "at": 0.8,
          "color": 576286207
        },
        "5": {
          "at": 1,
          "color": 576286207
        },
        "length": 6
      }
    }
  }
}
 */

interface ChangeValue<TType, TValue, TNested = false> {
  key: string;
  index: number;
  old_value: TType extends 'pulled' | 'updated' ? TValue : null;
  value: TNested extends true ? ChangeValue<TType, TValue, false>[] : TValue;
}

export interface ChangeMap<TValue, TNested = false> {
  id: string;
  kind: number;
  actor?: StvUser;
  pushed?: ChangeValue<'pushed', TValue, TNested>[];
  pulled?: ChangeValue<'pulled', TValue, TNested>[];
  updated?: ChangeValue<'updated', TValue, TNested>[];
  contextual?: boolean;
}

export interface PaintShadow {
  color: number;
  radius: number;
  x_offset: number;
  y_offset: number;
}

export interface PaintStop {
  color: number;
  at: number;
}

/**
 * A collection of items with numeric indices and a length property
 * Used for shadows and stops in paint data
 */
export interface IndexedCollection<T> {
  [key: number]: T;
  length: number;
}

export interface BadgeData extends EventObject {
  host: SevenTvHost;
  tooltip: string;
}

export interface PaintData {
  id: string;
  name: string;
  color: number | null;
  gradients: {
    length: number;
  };
  shadows: IndexedCollection<PaintShadow>;
  text: string | null;
  function: 'LINEAR_GRADIENT' | 'RADIAL_GRADIENT' | 'URL';
  repeat: boolean;
  angle: number;
  shape: 'circle' | 'ellipse';
  image_url: string;
  stops: IndexedCollection<PaintStop>;
}

interface PaintCosmeticObject {
  id: string;
  kind: 'PAINT';
  data: PaintData;
}

interface BadgeCosmeticObject {
  id: string;
  kind: 'BADGE';
  data: BadgeData;
}

export interface PaintCosmetic {
  id: string;
  kind: number;
  object: PaintCosmeticObject;
}

export interface BadgeCosmetic {
  id: string;
  kind: number;
  object: BadgeCosmeticObject;
}

export type CosmeticCreate = BadgeCosmetic | PaintCosmetic;

type EmoteChange = SevenTvEmote & { origin_id: string | null };

interface EmoteSetCreate extends EventObject {
  capacity: number;
  flags: number;
  immutable: boolean;
  privileged: boolean;
  tags: string[];
  owner: StvUser;
}

export interface EntitlementUserStyle {
  color?: number;
  paint_id?: string;
  badge_id?: string;
}

export interface EntitlementUserConnection {
  id: string;
  platform: 'TWITCH';
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id: string;
}

export interface EntitlementUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  style: EntitlementUserStyle;
  role_ids: IndexedCollection<string>;
  connections: IndexedCollection<EntitlementUserConnection>;
}

export interface EntitlementObject {
  id: string;
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
  ref_id: string;
  user: EntitlementUser;
}

export interface EntitlementCreate {
  id: string;
  kind: number;
  object: EntitlementObject;
}

export interface SevenTvEventMap {
  // Cosmetic events
  'cosmetic.create': CosmeticCreate;
  'cosmetic.update': ChangeMap<CosmeticCreate>;
  'cosmetic.delete': { id: string };
  'cosmetic.*': CosmeticCreate | ChangeMap<CosmeticCreate> | { id: string };

  // Emote set events
  'emote_set.create': EmoteSetCreate;
  'emote_set.update': ChangeMap<EmoteChange>;
  'emote_set.delete': { id: string };
  'emote_set.*': EmoteSetCreate | ChangeMap<EmoteChange> | { id: string };

  // Emote events
  'emote.create': SevenTvEmote;
  'emote.update': ChangeMap<SevenTvEmote>;
  'emote.delete': { id: string };
  'emote.*': SevenTvEmote | ChangeMap<SevenTvEmote> | { id: string };

  // User events
  'user.create': StvUser;
  'user.update': ChangeMap<EventObject | null, true>;
  'user.delete': { id: string };
  'user.*': StvUser | ChangeMap<EventObject | null, true> | { id: string };

  // Entitlement events
  'entitlement.create': EntitlementCreate;
  'entitlement.update': ChangeMap<EntitlementCreate>;
  'entitlement.delete': { id: string };
  'entitlement.*':
    | EntitlementCreate
    | ChangeMap<EntitlementCreate>
    | { id: string };
}

/**
 * All possible SevenTV event types
 */
export type SevenTvEventType = keyof SevenTvEventMap;

/**
 * Event data payload with type-safe body based on event type
 */
export interface SevenTvEventData<
  T extends SevenTvEventType = SevenTvEventType,
> {
  type: T;
  body: SevenTvEventMap[T];
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
        condition: TEventType extends 'entitlement.create' | 'cosmetic.create'
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
   * Track active subscriptions to prevent duplicates
   */
  private static activeSubscriptions: Set<string> = new Set();

  /**
   * Timeout for waiting for IDs to be set (in milliseconds)
   */
  private static readonly ID_WAIT_TIMEOUT: number = 30000; // 30 seconds

  /**
   * Timestamp when we first connected to filter out historical events
   */
  private static connectionTimestamp: number = 0;

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

  private static cosmeticCreateCallback:
    | ((data: CosmeticCreateCallbackData) => void)
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

      // Set connection timestamp to filter out historical events
      SevenTvWsService.connectionTimestamp = Date.now();

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
      const message = JSON.parse(event.data as string) as SevenTvWsMessage<
        SevenTvEventData<SevenTvEventType>
      >;

      logger.stvWs.debug('[onMessage] Received message with op:', message.op);

      switch (message.op) {
        case 0: {
          // Add defensive checks to ensure message.d exists and has the expected structure
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
              SevenTvWsService.handleEmoteSetUpdate(
                message.d as SevenTvEventData<'emote_set.update'>,
              );
              break;
            }

            case 'cosmetic.create': {
              logger.stvWs.debug('cosmetic.create event received');
              SevenTvWsService.handleCosmeticCreate(
                message.d as SevenTvEventData<'cosmetic.create'>,
              );
              break;
            }

            default: {
              // Unhandled event types
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

  private static handleEmoteSetUpdate(
    data: SevenTvEventData<'emote_set.update'>,
  ): void {
    try {
      // Filter out historical events by checking if this is within the first few seconds of connection
      // This helps filter out the initial historical events that come when first subscribing
      const timeSinceConnection =
        Date.now() - SevenTvWsService.connectionTimestamp;

      const HISTORICAL_EVENT_BUFFER = 5000; // 5 seconds buffer

      if (timeSinceConnection < HISTORICAL_EVENT_BUFFER) {
        logger.stvWs.info(
          '💚 Ignoring potential historical emote set update event (within buffer period)',
        );
        return;
      }

      const addedEmotes: SanitisiedEmoteSet[] = [];
      const removedEmotes: SanitisiedEmoteSet[] = [];

      const { body } = data;

      /**
       * New emotes have been added to the set
       */
      if (body.pushed) {
        body.pushed.forEach(emote => {
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
            actor: body.actor,
          });
        });
      }

      if (body.pulled) {
        logger.stvWs.debug('Emote removed by:', body.actor?.display_name);

        Object.values(body.pulled).forEach(emote => {
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

  private static handleCosmeticCreate(
    data: SevenTvEventData<'cosmetic.create'>,
  ): void {
    try {
      const { body } = data;

      if (SevenTvWsService.cosmeticCreateCallback) {
        SevenTvWsService.cosmeticCreateCallback({
          cosmetic: body,
          kind: body.object.kind,
        });
      }
    } catch (e) {
      logger.stvWs.error('Error handling cosmetic create:', e);
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

      // logger.stvWs.info('💚 Subscribed to entitlement.create events');
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
      // logger.stvWs.info('💚 Subscribed to emote_set.update events');
    }
  }

  /**
   * Send subscription payload for a specific emote set
   */
  private static sendSubscription(emoteSetId: string): void {
    // logger.stvWs.info(`💚 Attempting to subscribe to emote set: ${emoteSetId}`);

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
    // Check if already subscribed to this emote set
    if (SevenTvWsService.activeSubscriptions.has(emoteSetId)) {
      logger.stvWs.info(`💚 Already subscribed to emote set: ${emoteSetId}`);
      return;
    }

    // Unsubscribe from previous channel if different
    if (
      SevenTvWsService.currentEmoteSetId &&
      SevenTvWsService.currentEmoteSetId !== emoteSetId
    ) {
      SevenTvWsService.unsubscribeFromEmoteSet(
        SevenTvWsService.currentEmoteSetId,
      );
      SevenTvWsService.activeSubscriptions.delete(
        SevenTvWsService.currentEmoteSetId,
      );
    }

    SevenTvWsService.currentEmoteSetId = emoteSetId;

    if (SevenTvWsService.isConnected() && emoteSetId) {
      SevenTvWsService.sendSubscription(emoteSetId);
      SevenTvWsService.activeSubscriptions.add(emoteSetId);
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
      SevenTvWsService.activeSubscriptions.delete(
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
   * Set the cosmetic create callback
   */
  public static setCosmeticCreateCallback(
    callback: ((data: CosmeticCreateCallbackData) => void) | null,
  ): void {
    SevenTvWsService.cosmeticCreateCallback = callback;
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
      SevenTvWsService.activeSubscriptions.clear();
      SevenTvWsService.emoteUpdateCallback = null;
      SevenTvWsService.cosmeticCreateCallback = null;

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
