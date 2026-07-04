import type {
  BadgeCosmetic,
  ChangeMap,
  CosmeticCreate,
  EntitlementCreate,
  EntitlementUser,
  PaintCosmetic,
  SevenTvEventData,
  SevenTvEventType,
  SevenTvWsMessage,
} from '@app/types/seventv/cosmetics';
import type { SevenTvEmote, SevenTvFile } from '@app/types/seventv/emotes';
import type { StvUser } from '@app/types/seventv/users';
import type { SeventvWsInterpreterContext } from '@app/utils/seventv/seventvWsInterpreter';

type EmoteChange = SevenTvEmote & { origin_id: string | null };

type EmoteSetUpdateBody = SevenTvEventData<'emote_set.update'>['body'];

export const FIXTURE_NOW = Date.parse('2025-06-01T12:00:00.000Z');

export function createContext(
  overrides: Partial<SeventvWsInterpreterContext> = {},
): SeventvWsInterpreterContext {
  return {
    expectedEmoteSetId: 'set-1',
    connectionTimestamp: null,
    channelId: '12345',
    now: FIXTURE_NOW,
    ...overrides,
  };
}

export function createSevenTvFile(overrides: {
  name: string;
  width: number;
  height: number;
  frame_count?: number;
  format?: string;
}): SevenTvFile {
  return {
    name: overrides.name,
    static_name: overrides.name,
    width: overrides.width,
    height: overrides.height,
    frame_count: overrides.frame_count ?? 1,
    size: 1024,
    format: overrides.format ?? 'AVIF',
  };
}

export function createSevenTvEmote(overrides: {
  id: string;
  name: string;
  originalName?: string;
  flags?: number;
  files?: SevenTvFile[];
}): EmoteChange {
  return {
    id: overrides.id,
    name: overrides.name,
    flags: 0,
    timestamp: 1750000000000,
    actor_id: 'stv-actor-1',
    origin_id: null,
    data: {
      id: overrides.id,
      name: overrides.originalName ?? overrides.name,
      flags: overrides.flags ?? 0,
      lifecycle: 3,
      state: ['LISTED'],
      listed: true,
      animated: true,
      owner: {
        id: 'stv-owner-1',
        username: 'emoteauthor',
        display_name: 'EmoteAuthor',
        style: {},
        role_ids: [],
        connection: [],
      },
      host: {
        url: `//cdn.7tv.app/emote/${overrides.id}`,
        files: overrides.files ?? [
          createSevenTvFile({ name: '1x.avif', width: 32, height: 32 }),
          createSevenTvFile({
            name: '4x.avif',
            width: 128,
            height: 128,
            frame_count: 60,
          }),
        ],
      },
    },
  };
}

export function createStvActor(): StvUser {
  return {
    id: 'stv-actor-1',
    username: 'moduser',
    display_name: 'ModUser',
    avatar_url: 'https://cdn.7tv.app/avatar.png',
    style: {},
    role_ids: [],
    connection: [],
  };
}

export function createPushedChange(
  emote: EmoteChange,
): NonNullable<EmoteSetUpdateBody['pushed']>[number] {
  return {
    key: 'emotes',
    index: 0,
    old_value: null,
    value: emote,
  };
}

export function createPulledChange(
  emote: EmoteChange,
): NonNullable<EmoteSetUpdateBody['pulled']>[number] {
  return {
    key: 'emotes',
    index: 0,
    old_value: emote,
    value: emote,
  };
}

export function createUpdatedChange(
  oldEmote: EmoteChange,
  newEmote: EmoteChange,
): NonNullable<EmoteSetUpdateBody['updated']>[number] {
  return {
    key: 'emotes',
    index: 0,
    old_value: oldEmote,
    value: newEmote,
  };
}

export function createEmoteSetUpdateEvent(
  body: Partial<EmoteSetUpdateBody> & { id: string },
): SevenTvEventData<'emote_set.update'> {
  return {
    type: 'emote_set.update',
    body: {
      kind: 2,
      ...body,
    },
  };
}

export function createEntitlementUser(
  overrides: {
    ttvConnectionId?: string;
    paintId?: string;
    badgeId?: string;
  } = {},
): EntitlementUser {
  const connections: EntitlementUser['connections'] = overrides.ttvConnectionId
    ? {
        0: {
          id: overrides.ttvConnectionId,
          platform: 'TWITCH',
          username: 'chatter',
          display_name: 'Chatter',
          linked_at: 1750000000000,
          emote_capacity: 1000,
          emote_set_id: 'emote-set-1',
        },
        length: 1,
      }
    : { length: 0 };

  return {
    id: 'stv-user-1',
    username: 'chatter',
    display_name: 'Chatter',
    avatar_url: 'https://cdn.7tv.app/avatar.png',
    style: {
      ...(overrides.paintId ? { paint_id: overrides.paintId } : {}),
      ...(overrides.badgeId ? { badge_id: overrides.badgeId } : {}),
    },
    role_ids: { length: 0 },
    connections,
  };
}

export function createEntitlementCreate(overrides: {
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
  refId: string;
  user: EntitlementUser;
}): EntitlementCreate {
  return {
    id: 'entitlement-1',
    kind: 4,
    object: {
      id: 'entitlement-object-1',
      kind: overrides.kind,
      ref_id: overrides.refId,
      user: overrides.user,
    },
  };
}

export function createEntitlementCreateEvent(overrides: {
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
  refId: string;
  user: EntitlementUser;
}): SevenTvEventData<'entitlement.create'> {
  return {
    type: 'entitlement.create',
    body: createEntitlementCreate(overrides),
  };
}

export function createPaintCosmetic(overrides: {
  id: string;
  name: string;
}): PaintCosmetic {
  return {
    id: overrides.id,
    kind: 3,
    object: {
      id: overrides.id,
      kind: 'PAINT',
      data: {
        id: overrides.id,
        name: overrides.name,
        color: null,
        function: 'LINEAR_GRADIENT',
        layers: { length: 0 },
        shadows: { length: 0 },
        textStyle: null,
        repeat: false,
        angle: 90,
        shape: 'circle',
        image_url: '',
        stops: { length: 0 },
      },
    },
  };
}

export function createBadgeCosmetic(overrides: {
  id: string;
  name: string;
}): BadgeCosmetic {
  return {
    id: overrides.id,
    kind: 3,
    object: {
      id: overrides.id,
      kind: 'BADGE',
      data: {
        id: overrides.id,
        name: overrides.name,
        tooltip: overrides.name,
        host: {
          url: `//cdn.7tv.app/badge/${overrides.id}`,
          files: [
            {
              name: '1x',
              static_name: '1x',
              width: 18,
              height: 18,
              frame_count: 1,
              size: 1024,
              format: 'WEBP',
            },
          ],
        },
      },
    },
  };
}

export function createCosmeticUpdateEvent(
  changes: Partial<ChangeMap<CosmeticCreate>>,
): SevenTvEventData<'cosmetic.update'> {
  return {
    type: 'cosmetic.update',
    body: {
      id: 'cosmetic-change-1',
      kind: 3,
      ...changes,
    },
  };
}

export function createCosmeticChangeEntry(
  cosmetic: CosmeticCreate,
): NonNullable<ChangeMap<CosmeticCreate>['updated']>[number] {
  return {
    key: 'data',
    index: 0,
    old_value: cosmetic,
    value: cosmetic,
  };
}

export function createCosmeticPushedEntry(
  cosmetic: CosmeticCreate,
): NonNullable<ChangeMap<CosmeticCreate>['pushed']>[number] {
  return {
    key: 'data',
    index: 0,
    old_value: null,
    value: cosmetic,
  };
}

export function createEntitlementUpdateEvent(
  changes: Partial<ChangeMap<EntitlementCreate>>,
): SevenTvEventData<'entitlement.update'> {
  return {
    type: 'entitlement.update',
    body: {
      id: 'entitlement-change-1',
      kind: 4,
      ...changes,
    },
  };
}

export function createEntitlementChangeEntry(
  entitlement: EntitlementCreate,
): NonNullable<ChangeMap<EntitlementCreate>['updated']>[number] {
  return {
    key: 'object',
    index: 0,
    old_value: entitlement,
    value: entitlement,
  };
}

export function createDispatchMessage(
  data: SevenTvEventData<SevenTvEventType>,
): SevenTvWsMessage<SevenTvEventData<SevenTvEventType>> {
  return { op: 0, d: data };
}

/**
 * Builds an event payload from raw data the way the runtime receives it,
 * via a JSON round trip. Used for malformed payload cases the type system
 * would otherwise reject.
 */
export function coerceEvent<T extends SevenTvEventType>(
  raw: object,
): SevenTvEventData<T> {
  return JSON.parse(JSON.stringify(raw)) as SevenTvEventData<T>;
}

/**
 * Builds a full ws message from raw data via a JSON round trip. Used for
 * malformed message cases the type system would otherwise reject.
 */
export function coerceMessage(
  raw: object,
): SevenTvWsMessage<SevenTvEventData<SevenTvEventType>> {
  return JSON.parse(JSON.stringify(raw)) as SevenTvWsMessage<
    SevenTvEventData<SevenTvEventType>
  >;
}
