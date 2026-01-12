/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import {
  CosmeticCreateCallbackData,
  CosmeticUpdateCallbackData,
  CosmeticDeleteCallbackData,
  EntitlementCreateCallbackData,
  EntitlementUpdateCallbackData,
  EntitlementDeleteCallbackData,
} from '@app/hooks/useSeventvWs';
import { logger } from '@app/utils/logger';
import {
  StvUser,
  SevenTvEmote,
  SanitisiedEmoteSet,
  SevenTvHost,
} from '../../services/seventv-service';
import { IndexedCollection } from '../../services/ws/util/indexedCollection';

interface EventObject {
  id: string;
  name: string;
}

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

/**
 * Represents a color value from 7TV stored as a signed 32-bit integer in RGBA format.
 *
 * The color is packed into 32 bits with the following layout:
 * - Bits 24-31: Red channel (0-255)
 * - Bits 16-23: Green channel (0-255)
 * - Bits 8-15: Blue channel (0-255)
 * - Bits 0-7: Alpha channel (0-255)
 *
 * @example
 * // Fully opaque red: 0xFF0000FF
 * // Fully opaque green: 0x00FF00FF
 * // Semi-transparent blue: 0x0000FF80
 */
export type SevenTvColor = number;

/**
 * Represents a drop shadow effect applied to a 7TV paint cosmetic.
 *
 * Shadows are rendered behind the text to create depth and visual effects.
 * Multiple shadows can be combined for complex glow or outline effects.
 */
export interface PaintShadow {
  /**
   * The shadow color as a 7TV packed RGBA integer.
   * @see {@link SevenTvColor} for the color format specification.
   */
  color: SevenTvColor;

  /**
   * The blur radius of the shadow in pixels.
   * Higher values create a softer, more diffuse shadow effect.
   */
  radius: number;

  /**
   * The horizontal offset of the shadow from the text in pixels.
   * Positive values move the shadow to the right.
   */
  x_offset: number;

  /**
   * The vertical offset of the shadow from the text in pixels.
   * Positive values move the shadow downward.
   */
  y_offset: number;
}

/**
 * Represents a single color stop in a gradient paint.
 *
 * Gradient stops define the colors and their positions along the gradient axis.
 * Multiple stops are combined to create smooth color transitions.
 */
export interface PaintStop {
  /**
   * The color at this stop as a 7TV packed RGBA integer.
   * @see {@link SevenTvColor} for the color format specification.
   */
  color: SevenTvColor;

  /**
   * The position of this stop along the gradient axis.
   * Value ranges from 0 (start) to 1 (end).
   */
  at: number;
}

/**
 * Converts a 7TV packed RGBA color integer to its individual channel components.
 *
 * Uses unsigned right shift (`>>>`) to correctly handle signed 32-bit integers,
 * which is necessary because JavaScript stores numbers as 64-bit floats but
 * bitwise operations convert to 32-bit signed integers.
 *
 * @param color - The packed RGBA color as a 32-bit signed integer.
 * @returns An object containing the red, green, blue, and alpha channel values (0-255).
 *
 * @example
 * ```typescript
 * const { r, g, b, a } = sevenTvColorToRgba(-1675056641);
 * // Result: { r: 156, g: 89, b: 182, a: 255 } (purple, fully opaque)
 * ```
 */

/**
 * Defines the type of gradient or fill function used by a 7TV paint cosmetic.
 *
 * - `LINEAR_GRADIENT`: A gradient that transitions colors along a straight line at a specified angle.
 * - `RADIAL_GRADIENT`: A gradient that radiates colors outward from a center point.
 * - `URL`: An image-based paint loaded from a URL.
 */
export type PaintFunction = 'LINEAR_GRADIENT' | 'RADIAL_GRADIENT' | 'URL';

/**
 * Defines the shape of a radial gradient paint.
 *
 * - `circle`: A perfectly round gradient that extends equally in all directions.
 * - `ellipse`: An oval gradient that can stretch differently along the horizontal and vertical axes.
 */
export type PaintShape = 'circle' | 'ellipse';

/**
 * Represents a 7TV badge cosmetic with its visual and metadata.
 */
export interface BadgeData extends EventObject {
  /** The CDN host information for badge image URLs. */
  host: SevenTvHost;

  /** The tooltip text displayed when hovering over the badge. */
  tooltip: string;
}

/**
 * Represents a 7TV paint cosmetic that can be applied to usernames.
 *
 * Paints are visual effects that modify how a user's name appears in chat.
 * They can include gradients (linear or radial), solid colors, images,
 * and shadow effects for enhanced visual impact.
 *
 * @example
 * ```typescript
 * // A linear gradient paint (Northern Light)
 * const paint: PaintData = {
 *   id: "01KDREVNA4XVTD3G04PWWDQMGF",
 *   name: "Northern Light",
 *   function: "LINEAR_GRADIENT",
 *   angle: 45,
 *   stops: { "0": { at: 0, color: -1675056641 }, "length": 1 },
 *   shadows: { "0": { x_offset: 0, y_offset: 0, radius: 0.1, color: 2096885247 }, "length": 1 },
 *   // ...other fields
 * };
 * ```
 */
export interface PaintData {
  /**
   * The unique identifier for this paint.
   * Used to reference the paint in entitlements and cache lookups.
   */
  id: string;

  /**
   * The display name of the paint shown to users.
   * @example "Northern Light", "Galaxy", "Fire"
   */
  name: string;

  /**
   * A solid fallback color used when the paint function is not gradient-based,
   * or when gradient stops are not available.
   * @see {@link SevenTvColor} for the color format specification.
   */
  color: SevenTvColor | null;

  /**
   * Legacy gradient layers container.
   * Currently unused in favor of the `stops` property, kept for API compatibility.
   */
  gradients: {
    length: number;
  };

  /**
   * Drop shadow effects applied behind the painted text.
   * Multiple shadows can be combined for glow, outline, or depth effects.
   */
  shadows: IndexedCollection<PaintShadow>;

  /**
   * Optional text content associated with the paint.
   * Rarely used in practice.
   */
  text: string | null;

  /**
   * The type of gradient or fill function used to render this paint.
   * Determines how the `stops`, `angle`, and `shape` properties are interpreted.
   */
  function: PaintFunction;

  /**
   * Whether the gradient pattern should repeat beyond its natural bounds.
   * When `true`, the gradient tiles to fill the available space.
   */
  repeat: boolean;

  /**
   * The angle of rotation for linear gradients, in degrees.
   * - `0`: Left to right
   * - `90`: Bottom to top
   * - `180`: Right to left
   * - `270`: Top to bottom
   *
   * Only applicable when `function` is `LINEAR_GRADIENT`.
   */
  angle: number;

  /**
   * The shape of radial gradients.
   * Only applicable when `function` is `RADIAL_GRADIENT`.
   */
  shape: PaintShape;

  /**
   * The URL of an image to use as the paint texture.
   * Only applicable when `function` is `URL`.
   */
  image_url: string;

  /**
   * The color stops that define the gradient transition.
   * Each stop specifies a color and its position (0-1) along the gradient axis.
   */
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

  private static cosmeticUpdateCallback:
    | ((data: CosmeticUpdateCallbackData) => void)
    | null = null;

  private static cosmeticDeleteCallback:
    | ((data: CosmeticDeleteCallbackData) => void)
    | null = null;

  private static entitlementCreateCallback:
    | ((data: EntitlementCreateCallbackData) => void)
    | null = null;

  private static entitlementUpdateCallback:
    | ((data: EntitlementUpdateCallbackData) => void)
    | null = null;

  private static entitlementDeleteCallback:
    | ((data: EntitlementDeleteCallbackData) => void)
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

            case 'cosmetic.update': {
              logger.stvWs.debug('cosmetic.update event received');
              SevenTvWsService.handleCosmeticUpdate(
                message.d as SevenTvEventData<'cosmetic.update'>,
              );
              break;
            }

            case 'cosmetic.delete': {
              logger.stvWs.debug('cosmetic.delete event received');
              SevenTvWsService.handleCosmeticDelete(
                message.d as SevenTvEventData<'cosmetic.delete'>,
              );
              break;
            }

            case 'entitlement.create': {
              logger.stvWs.debug('entitlement.create event received');
              SevenTvWsService.handleEntitlementCreate(
                message.d as SevenTvEventData<'entitlement.create'>,
              );
              break;
            }

            case 'entitlement.update': {
              logger.stvWs.debug('entitlement.update event received');
              SevenTvWsService.handleEntitlementUpdate(
                message.d as SevenTvEventData<'entitlement.update'>,
              );
              break;
            }

            case 'entitlement.delete': {
              logger.stvWs.debug('entitlement.delete event received');
              SevenTvWsService.handleEntitlementDelete(
                message.d as SevenTvEventData<'entitlement.delete'>,
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

      const HISTORICAL_EVENT_BUFFER = 5000; // 2 seconds buffer

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

  private static handleCosmeticUpdate(
    data: SevenTvEventData<'cosmetic.update'>,
  ): void {
    try {
      const { body } = data;
      let kind: 'PAINT' | 'BADGE' | null = null;

      // Check updated values to determine kind
      if (body.updated) {
        // eslint-disable-next-line no-restricted-syntax
        for (const update of body.updated) {
          if (update.value && typeof update.value === 'object') {
            if ('object' in update.value && update.value.object) {
              kind = update.value.object.kind === 'BADGE' ? 'BADGE' : 'PAINT';
              break;
            }
          }
        }
      }

      // Check pushed values
      if (!kind && body.pushed) {
        // eslint-disable-next-line no-restricted-syntax
        for (const push of body.pushed) {
          if (push.value && typeof push.value === 'object') {
            if ('object' in push.value && push.value.object) {
              kind = push.value.object.kind === 'BADGE' ? 'BADGE' : 'PAINT';
              break;
            }
          }
        }
      }

      if (SevenTvWsService.cosmeticUpdateCallback) {
        SevenTvWsService.cosmeticUpdateCallback({
          changes: body,
          kind,
        });
      }
    } catch (e) {
      logger.stvWs.error('Error handling cosmetic update:', e);
    }
  }

  private static handleCosmeticDelete(
    data: SevenTvEventData<'cosmetic.delete'>,
  ): void {
    try {
      const { body } = data;

      if (SevenTvWsService.cosmeticDeleteCallback) {
        SevenTvWsService.cosmeticDeleteCallback({
          cosmeticId: body.id,
        });
      }
    } catch (e) {
      logger.stvWs.error('Error handling cosmetic delete:', e);
    }
  }

  private static handleEntitlementCreate(
    data: SevenTvEventData<'entitlement.create'>,
  ): void {
    try {
      const { body: entitlement } = data;
      const { kind } = entitlement.object;

      let ttvUserId: string | null = null;
      if (entitlement.object.user.connections) {
        const twitchConnection = Object.values(
          entitlement.object.user.connections,
        ).find(
          conn =>
            conn &&
            typeof conn === 'object' &&
            'platform' in conn &&
            conn.platform === 'TWITCH',
        );

        if (
          twitchConnection &&
          typeof twitchConnection === 'object' &&
          'id' in twitchConnection &&
          typeof twitchConnection.id === 'string'
        ) {
          ttvUserId = twitchConnection.id;
        }
      }

      // Extract paint_id and badge_id from style
      // Also use ref_id as the authoritative ID when kind matches
      let paintId: string | null = null;
      let badgeId: string | null = null;

      if (entitlement.object.user.style) {
        if (entitlement.object.user.style.paint_id) {
          paintId = entitlement.object.user.style.paint_id;
        }
        if (entitlement.object.user.style.badge_id) {
          badgeId = entitlement.object.user.style.badge_id;
        }
      }

      // Use ref_id as the authoritative cosmetic ID when kind matches
      // This ensures we use the correct ID even if style doesn't have it yet
      if (kind === 'PAINT' && entitlement.object.ref_id) {
        paintId = entitlement.object.ref_id;
      }
      if (kind === 'BADGE' && entitlement.object.ref_id) {
        badgeId = entitlement.object.ref_id;
      }

      if (SevenTvWsService.entitlementCreateCallback) {
        SevenTvWsService.entitlementCreateCallback({
          entitlement,
          kind,
          ttvUserId,
          paintId,
          badgeId,
        });
      }
    } catch (e) {
      logger.stvWs.error('Error handling entitlement create:', e);
    }
  }

  private static handleEntitlementUpdate(
    data: SevenTvEventData<'entitlement.update'>,
  ): void {
    try {
      const { body } = data;
      let ttvUserId: string | null = null;
      let paintId: string | null = null;
      let badgeId: string | null = null;

      if (body.updated) {
        // eslint-disable-next-line no-restricted-syntax
        for (const update of body.updated) {
          if (update.value && typeof update.value === 'object') {
            if ('object' in update.value && update.value.object) {
              const entitlement = update.value.object;

              // Extract Twitch user ID from connections
              if (entitlement.user?.connections) {
                const twitchConnection = Object.values(
                  entitlement.user.connections,
                ).find(
                  conn =>
                    conn &&
                    typeof conn === 'object' &&
                    'platform' in conn &&
                    conn.platform === 'TWITCH',
                );

                if (
                  twitchConnection &&
                  typeof twitchConnection === 'object' &&
                  'id' in twitchConnection &&
                  typeof twitchConnection.id === 'string'
                ) {
                  ttvUserId = twitchConnection.id;
                }
              }

              if (entitlement.user?.style) {
                if (entitlement.user.style.paint_id) {
                  paintId = entitlement.user.style.paint_id;
                }
                if (entitlement.user.style.badge_id) {
                  badgeId = entitlement.user.style.badge_id;
                }
              }
            }
          }
        }
      }

      if (!ttvUserId && body.pushed) {
        // eslint-disable-next-line no-restricted-syntax
        for (const push of body.pushed) {
          if (push.value && typeof push.value === 'object') {
            if ('object' in push.value && push.value.object) {
              const entitlement = push.value.object;

              if (entitlement.user?.connections) {
                const twitchConnection = Object.values(
                  entitlement.user.connections,
                ).find(
                  conn =>
                    conn &&
                    typeof conn === 'object' &&
                    'platform' in conn &&
                    conn.platform === 'TWITCH',
                );

                if (
                  twitchConnection &&
                  typeof twitchConnection === 'object' &&
                  'id' in twitchConnection &&
                  typeof twitchConnection.id === 'string'
                ) {
                  ttvUserId = twitchConnection.id;
                }
              }

              if (entitlement.user?.style) {
                if (entitlement.user.style.paint_id) {
                  paintId = entitlement.user.style.paint_id;
                }
                if (entitlement.user.style.badge_id) {
                  badgeId = entitlement.user.style.badge_id;
                }
              }
            }
          }
        }
      }

      if (SevenTvWsService.entitlementUpdateCallback) {
        SevenTvWsService.entitlementUpdateCallback({
          changes: body,
          ttvUserId,
          paintId,
          badgeId,
        });
      }
    } catch (e) {
      logger.stvWs.error('Error handling entitlement update:', e);
    }
  }

  private static handleEntitlementDelete(
    data: SevenTvEventData<'entitlement.delete'>,
  ): void {
    try {
      const { body } = data;
      const entitlementId = body.id;

      if (SevenTvWsService.entitlementDeleteCallback) {
        SevenTvWsService.entitlementDeleteCallback({
          entitlementId,
          ttvUserId: null,
        });
      }
    } catch (e) {
      logger.stvWs.error('Error handling entitlement delete:', e);
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

    // Subscribe to all entitlement events if twitchChannelId is available
    if (SevenTvWsService.twitchChannelId) {
      // Subscribe to entitlement.create
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

      const subscribeEntitlementUpdateMessage: SevenTvWsMessage<
        never,
        'entitlement.update'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'entitlement.update',
          condition: {
            object_id: SevenTvWsService.twitchChannelId,
          },
        },
      };

      SevenTvWsService.instance.send(
        JSON.stringify(subscribeEntitlementUpdateMessage),
      );

      const subscribeEntitlementDeleteMessage: SevenTvWsMessage<
        never,
        'entitlement.delete'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'entitlement.delete',
          condition: {
            object_id: SevenTvWsService.twitchChannelId,
          },
        },
      };

      SevenTvWsService.instance.send(
        JSON.stringify(subscribeEntitlementDeleteMessage),
      );

      logger.stvWs.info(
        '💚 Subscribed to all entitlement events (create, update, delete)',
      );
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

    // Subscribe to all cosmetic events if twitchChannelId is available
    if (SevenTvWsService.twitchChannelId) {
      // Subscribe to cosmetic.create
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
            id: SevenTvWsService.twitchChannelId,
          },
        },
      };

      SevenTvWsService.instance.send(
        JSON.stringify(subscribeCosmeticCreateMessage),
      );

      // Subscribe to cosmetic.update
      const subscribeCosmeticUpdateMessage: SevenTvWsMessage<
        never,
        'cosmetic.update'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'cosmetic.update',
          condition: {
            object_id: SevenTvWsService.twitchChannelId,
          },
        },
      };

      SevenTvWsService.instance.send(
        JSON.stringify(subscribeCosmeticUpdateMessage),
      );

      // Subscribe to cosmetic.delete
      const subscribeCosmeticDeleteMessage: SevenTvWsMessage<
        never,
        'cosmetic.delete'
      > = {
        op: 35,
        t: Date.now(),
        d: {
          type: 'cosmetic.delete',
          condition: {
            object_id: SevenTvWsService.twitchChannelId,
          },
        },
      };

      SevenTvWsService.instance.send(
        JSON.stringify(subscribeCosmeticDeleteMessage),
      );

      logger.stvWs.info(
        '💚 Subscribed to all cosmetic events (create, update, delete)',
      );
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
   * Set the cosmetic update callback
   */
  public static setCosmeticUpdateCallback(
    callback: ((data: CosmeticUpdateCallbackData) => void) | null,
  ): void {
    SevenTvWsService.cosmeticUpdateCallback = callback;
  }

  /**
   * Set the cosmetic delete callback
   */
  public static setCosmeticDeleteCallback(
    callback: ((data: CosmeticDeleteCallbackData) => void) | null,
  ): void {
    SevenTvWsService.cosmeticDeleteCallback = callback;
  }

  /**
   * Set the entitlement create callback
   */
  public static setEntitlementCreateCallback(
    callback: ((data: EntitlementCreateCallbackData) => void) | null,
  ): void {
    SevenTvWsService.entitlementCreateCallback = callback;
  }

  /**
   * Set the entitlement update callback
   */
  public static setEntitlementUpdateCallback(
    callback: ((data: EntitlementUpdateCallbackData) => void) | null,
  ): void {
    SevenTvWsService.entitlementUpdateCallback = callback;
  }

  /**
   * Set the entitlement delete callback
   */
  public static setEntitlementDeleteCallback(
    callback: ((data: EntitlementDeleteCallbackData) => void) | null,
  ): void {
    SevenTvWsService.entitlementDeleteCallback = callback;
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
      SevenTvWsService.cosmeticUpdateCallback = null;
      SevenTvWsService.cosmeticDeleteCallback = null;
      SevenTvWsService.entitlementCreateCallback = null;
      SevenTvWsService.entitlementUpdateCallback = null;
      SevenTvWsService.entitlementDeleteCallback = null;

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
