import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type { SevenTvEmote, SevenTvHost } from '@app/types/seventv/emotes';
import type { StvUser } from '@app/types/seventv/users';
import type { V4Badge, V4Paint } from '@app/utils/color/sevenTvPaintData/types';

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
 * 7TV packed RGBA as a signed 32-bit integer:
 * - Bits 24-31: Red (0-255)
 * - Bits 16-23: Green (0-255)
 * - Bits 8-15: Blue (0-255)
 * - Bits 0-7: Alpha (0-255)
 *
 * @example
 * // Fully opaque red: 0xFF0000FF
 * // Fully opaque teal: 0x00FF00FF
 * // Semi-transparent blue: 0x0000FF80
 */
export type SevenTvColor = number;

export interface PaintShadow {
  color: SevenTvColor;
  radius: number;
  x_offset: number;
  y_offset: number;
}

export interface PaintStop {
  color: SevenTvColor;
  /**
   * Position along the gradient axis, from 0 (start) to 1 (end).
   */
  at: number;
}

/**
 * - `LINEAR_GRADIENT`: colors along a line at `angle`
 * - `RADIAL_GRADIENT`: colors radiating from a center point
 * - `URL`: image-based paint
 */
export type PaintFunction = 'LINEAR_GRADIENT' | 'RADIAL_GRADIENT' | 'URL';

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

export interface BadgeData extends EventObject {
  host: SevenTvHost;
  tooltip: string;
}

export interface PaintData {
  id: string;
  name: string;
  /**
   * Solid fallback when the paint is not gradient-based or stops are missing.
   * @see {@link SevenTvColor}
   */
  color: SevenTvColor | null;

  layers: IndexedCollection<PaintLayerData>;

  shadows: IndexedCollection<PaintShadow>;

  textStyle: PaintTextStyle | null;

  function: PaintFunction;

  repeat: boolean;

  /**
   * Linear gradient angle in degrees (0 = left→right, 90 = bottom→top).
   * Only used when `function` is `LINEAR_GRADIENT`.
   */
  angle: number;

  /**
   * Only used when `function` is `RADIAL_GRADIENT`.
   */
  shape: PaintShape;

  /**
   * Only used when `function` is `URL`.
   */
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

export interface EntitlementResetCallbackData {
  sevenTvUserId: string;
}

export interface SevenTvEventMap {
  'cosmetic.create': CosmeticCreate;
  'cosmetic.update': ChangeMap<CosmeticCreate>;
  'cosmetic.delete': { id: string };
  'cosmetic.*': CosmeticCreate | ChangeMap<CosmeticCreate> | { id: string };

  'emote_set.create': EmoteSetCreate;
  'emote_set.update': ChangeMap<EmoteChange>;
  'emote_set.delete': { id: string };
  'emote_set.*': EmoteSetCreate | ChangeMap<EmoteChange> | { id: string };

  'emote.create': SevenTvEmote;
  'emote.update': ChangeMap<SevenTvEmote>;
  'emote.delete': { id: string };
  'emote.*': SevenTvEmote | ChangeMap<SevenTvEmote> | { id: string };

  'user.create': StvUser;
  'user.update': ChangeMap<EventObject | null, true>;
  'user.delete': { id: string };
  'user.*': StvUser | ChangeMap<EventObject | null, true> | { id: string };

  'entitlement.create': EntitlementCreate;
  'entitlement.update': ChangeMap<EntitlementCreate>;
  'entitlement.delete': { id: string };
  'entitlement.reset': { id: string };
  'entitlement.*':
    EntitlementCreate | ChangeMap<EntitlementCreate> | { id: string };
}

export type SevenTvEventType = keyof SevenTvEventMap;

export interface SevenTvEventData<
  T extends SevenTvEventType = SevenTvEventType,
> {
  type: T;
  body: SevenTvEventMap[T];
}

/**
 * Condition shape for Subscribe (op 35) / Unsubscribe (op 36) payloads.
 * Creation events filter by platform context; everything else filters on a
 * specific object id.
 */
type SevenTvSubscriptionCondition<TEventType> = TEventType extends
  'entitlement.create' | 'cosmetic.create'
  ? {
      platform?: 'TWITCH';
      ctx?: 'channel';
      id?: string;
    }
  : {
      object_id: string;
    };

export type SevenTvWsMessage<TData = unknown, TEventType = SevenTvEventType> =
  /**
   * Dispatch — event data for a subscribed event
   */
  | {
      op: 0;
      d: TData;
    }
  /**
   * Hello — received on connect with session info
   */
  | {
      op: 1;
      d?: {
        heartbeat_interval: number;
        session_id: string;
        subscription_limit: number;
        instance: {
          name: string;
          population: number;
        };
      };
      t?: number;
      s?: number;
    }
  /**
   * Heartbeat
   */
  | {
      op: 2;
      d: {
        count: number;
      };
      t: number;
      s: number;
    }
  /**
   * Reconnect — server wants the client to reconnect
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
        command: string;
        /**
         * Echo of client-sent data for SUBSCRIBE/UNSUBSCRIBE, or a result for RESUME
         */
        data: unknown;
      };
      t: number;
      s: number;
    }

  /**
   * Invalid subscription condition
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
        session_id: string;
      };
      t?: number;
      s?: number;
    }

  /**
   * End of stream — close code indicates whether the client should reconnect.
   */
  | {
      op: 7;
      d?: {
        code: number;
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
        condition: SevenTvSubscriptionCondition<TEventType>;
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
        condition: SevenTvSubscriptionCondition<TEventType>;
      };
    };
