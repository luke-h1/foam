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
 * 7TV colour packed as a signed 32-bit RGBA integer: R bits 24-31, G 16-23, B 8-15, A 0-7.
 */
export type SevenTvColor = number;

export interface PaintShadow {
  color: SevenTvColor;

  /**
   * Blur radius in pixels.
   */
  radius: number;

  x_offset: number;

  y_offset: number;
}

export interface PaintStop {
  color: SevenTvColor;

  /**
   * Position along the gradient axis, 0-1.
   */
  at: number;
}

export type PaintFunction = 'LINEAR_GRADIENT' | 'RADIAL_GRADIENT' | 'URL';

// oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- mirrors 7TV API field
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
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- mirrors 7TV API field
  shape: PaintShape;
  repeat: boolean;
  image_url: string;
  canvas_repeat: PaintCanvasRepeat;
  at: [number, number] | null;
  size: [number, number] | null;
  /**
   * v4 per-layer opacity (0-1); the whole layer span fades by this amount.
   * v3-era data carries no opacity; normalization defaults it to 1.
   */
  opacity: number;
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

/**
 * A 7TV paint cosmetic applied to a username: a linear/radial gradient,
 * solid colour or image fill, plus optional drop shadows.
 */
export interface PaintData {
  id: string;

  name: string;

  /**
   * Solid fallback used when the paint is not gradient-based or stops are missing.
   */
  color: SevenTvColor | null;

  layers: IndexedCollection<PaintLayerData>;

  shadows: IndexedCollection<PaintShadow>;

  textStyle: PaintTextStyle | null;

  function: PaintFunction;

  repeat: boolean;

  /**
   * Linear gradient angle in degrees; 0 = left to right, 90 = bottom to top.
   */
  angle: number;

  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- mirrors 7TV API field
  shape: PaintShape;

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
 * Condition for Subscribe (op 35) / Unsubscribe (op 36) payloads. Creation
 * events filter by platform context; everything else filters on an object id.
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
   * Dispatch: sent when a subscribed event fires.
   */
  | {
      op: 0;
      d: TData;
    }
  /**
   * Hello: session info, sent on connect.
   */
  | {
      op: 1;
      d?: {
        /**
         * Milliseconds between heartbeats.
         */
        heartbeat_interval: number;
        /**
         * Token used to resume or mutate the session.
         */
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
   * Heartbeat.
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
   * Reconnect: server wants the client to reconnect.
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
         * The acknowledged opcode in text form.
         */
        command: string;
        /**
         * Echoed client data for SUBSCRIBE/UNSUBSCRIBE; a result object for RESUME.
         */
        data: unknown;
      };
      t: number;
      s: number;
    }

  /**
   * Invalid subscription condition.
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
   * Resume the previous connection.
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
   * End of stream: server closed the connection; the code says why and
   * whether to reconnect.
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
   * Subscribe to an event.
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
   * Unsubscribe from an event.
   */
  | {
      op: 36;
      d: {
        type: TEventType;
        condition: SevenTvSubscriptionCondition<TEventType>;
      };
    };
