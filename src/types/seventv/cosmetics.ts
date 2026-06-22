import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type { SevenTvEmote, SevenTvHost } from '@app/types/seventv/emotes';
import type { StvUser } from '@app/types/seventv/users';
import type { V4Badge, V4Paint } from '@app/utils/color/sevenTvPaintData';

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
 * // Fully opaque teal: 0x00FF00FF
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
 * @returns An object containing the red, middle, blue, and alpha channel values (0-255).
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

export type PaintCanvasRepeat =
  | ''
  | 'no-repeat'
  | 'repeat'
  | 'repeat-x'
  | 'repeat-y'
  | 'round'
  | 'space'
  | 'revert'
  | 'unset';

export interface PaintLayerData {
  function: PaintFunction;
  stops: IndexedCollection<PaintStop>;
  angle: number;
  shape: PaintShape;
  repeat: boolean;
  image_url: string;
  canvas_repeat: PaintCanvasRepeat;
  at: [number, number] | null;
  size: [number, number] | null;
}

export interface PaintTextStroke {
  color: SevenTvColor;
  width: number;
}

export interface PaintTextStyle {
  weight?: number;
  transform?: 'uppercase' | 'lowercase';
  stroke?: PaintTextStroke;
  shadows?: IndexedCollection<PaintShadow>;
}

/**
 * Represents a 7TV badge cosmetic with its visual and metadata.
 */
export interface BadgeData extends EventObject {
  host: SevenTvHost;

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

  layers: IndexedCollection<PaintLayerData>;

  shadows: IndexedCollection<PaintShadow>;

  textStyle: PaintTextStyle | null;

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

export interface UserCosmeticsInfo {
  userId: string;
  ttvUserId: string | null;
  paintId: string | null;
  badgeId: string | null;
  paint: V4Paint | null;
  badge: V4Badge | null;
}

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

export interface CosmeticCreateCallbackData {
  cosmetic: CosmeticCreate;
  kind: 'PAINT' | 'BADGE';
}

export interface EntitlementCreateCallbackData {
  entitlement: EntitlementCreate;
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
  ttvUserId: string | null;
  paintId: string | null;
  badgeId: string | null;
}

export interface CosmeticUpdateCallbackData {
  changes: ChangeMap<CosmeticCreate>;
  kind: 'PAINT' | 'BADGE' | null;
}

export interface CosmeticDeleteCallbackData {
  cosmeticId: string;
}

export interface EntitlementUpdateCallbackData {
  changes: ChangeMap<EntitlementCreate>;
  ttvUserId: string | null;
  paintId: string | null;
  badgeId: string | null;
}

export interface EntitlementDeleteCallbackData {
  entitlementId: string;
  ttvUserId: string | null;
}

export interface SevenTvEventMap {
  // Cosmetics
  'cosmetic.create': CosmeticCreate;
  'cosmetic.update': ChangeMap<CosmeticCreate>;
  'cosmetic.delete': { id: string };
  'cosmetic.*': CosmeticCreate | ChangeMap<CosmeticCreate> | { id: string };

  // emote sets
  'emote_set.create': EmoteSetCreate;
  'emote_set.update': ChangeMap<EmoteChange>;
  'emote_set.delete': { id: string };
  'emote_set.*': EmoteSetCreate | ChangeMap<EmoteChange> | { id: string };

  // emotes
  'emote.create': SevenTvEmote;
  'emote.update': ChangeMap<SevenTvEmote>;
  'emote.delete': { id: string };
  'emote.*': SevenTvEmote | ChangeMap<SevenTvEmote> | { id: string };

  // users
  'user.create': StvUser;
  'user.update': ChangeMap<EventObject | null, true>;
  'user.delete': { id: string };
  'user.*': StvUser | ChangeMap<EventObject | null, true> | { id: string };

  // entitlements
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
