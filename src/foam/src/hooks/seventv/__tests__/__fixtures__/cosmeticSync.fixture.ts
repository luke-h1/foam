import type {
  BadgeCosmetic,
  ChangeMap,
  CosmeticCreate,
  EntitlementCreate,
  EntitlementUser,
  PaintCosmetic,
  SevenTvEventData,
} from '@app/types/seventv/cosmetics';

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
