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
 * A collection of items with numeric indices and a length property.
 *
 * This structure is used by 7TV WebSocket messages to represent arrays
 * in a JSON-object format. It's commonly used for shadows and gradient stops.
 *
 * @typeParam T - The type of items stored in the collection.
 *
 * @example
 * ```typescript
 * // Example from 7TV WebSocket message:
 * const stops: IndexedCollection<PaintStop> = {
 *   "0": { at: 0, color: -1675056641 },
 *   "1": { at: 0.5, color: 1560255231 },
 *   "2": { at: 1, color: 576286207 },
 *   "length": 3
 * };
 * ```
 */
export interface IndexedCollection<T> {
  [key: number]: T;
  length: number;
}

/**
 * Type guard to check if a value is an IndexedCollection.
 *
 * @typeParam T - The expected type of items in the collection.
 * @param value - The value to check.
 * @returns `true` if the value is an IndexedCollection, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isIndexedCollection<PaintStop>(data.stops)) {
 *   const stopsArray = indexedCollectionToArray(data.stops);
 * }
 * ```
 */
export function isIndexedCollection<T>(
  value: unknown,
): value is IndexedCollection<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'length' in value &&
    typeof (value as IndexedCollection<T>).length === 'number'
  );
}

/**
 * Converts an IndexedCollection to a standard TypeScript array.
 *
 * This utility handles the conversion from 7TV's object-based array format
 * to a native array, filtering out any undefined indices.
 *
 * @typeParam T - The type of items in the collection.
 * @param collection - The IndexedCollection to convert.
 * @returns A typed array containing all defined items from the collection.
 *
 * @example
 * ```typescript
 * const stops: IndexedCollection<PaintStop> = { "0": stop1, "1": stop2, "length": 2 };
 * const stopsArray: PaintStop[] = indexedCollectionToArray(stops);
 * // Result: [stop1, stop2]
 * ```
 */
export function indexedCollectionToArray<T>(
  collection: IndexedCollection<T>,
): T[] {
  const result: T[] = [];
  for (let i = 0; i < collection.length; i += 1) {
    if (collection[i] !== undefined) {
      result.push(collection[i] as T);
    }
  }
  return result;
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
export function sevenTvColorToRgba(color: SevenTvColor): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  // eslint-disable-next-line no-bitwise
  const r = (color >>> 24) & 0xff;
  // eslint-disable-next-line no-bitwise
  const g = (color >>> 16) & 0xff;
  // eslint-disable-next-line no-bitwise
  const b = (color >>> 8) & 0xff;
  // eslint-disable-next-line no-bitwise
  const a = color & 0xff;

  return { r, g, b, a };
}

/**
 * Converts a 7TV packed RGBA color integer to a CSS-compatible rgba() string.
 *
 * The alpha channel is normalized from 0-255 to 0-1 for CSS compatibility.
 *
 * @param color - The packed RGBA color as a 32-bit signed integer.
 * @returns A CSS rgba() color string.
 *
 * @example
 * ```typescript
 * const cssColor = sevenTvColorToCss(-1675056641);
 * // Result: "rgba(156, 89, 182, 1.00)"
 * ```
 */
export function sevenTvColorToCss(color: SevenTvColor): string {
  const { r, g, b, a } = sevenTvColorToRgba(color);
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}

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
