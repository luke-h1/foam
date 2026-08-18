// This file's shape usages are the 7TV paint API's PaintData/PaintLayerData.shape
// field (see types/seventv/cosmetics.ts), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import type {
  CosmeticCreateCallbackData,
  CosmeticUpdateCallbackData,
  EntitlementDeleteCallbackData,
  EntitlementUpdateCallbackData,
} from '@app/components/Chat/hooks/useSeventvWs';
import type {
  BadgeCosmetic,
  BadgeData,
  ChangeMap,
  CosmeticCreate,
  PaintCosmetic,
  PaintData,
} from '@app/types/seventv/cosmetics';
import type { SevenTvHost } from '@app/types/seventv/emotes';

const emptyIndexedCollection = { length: 0 };

function makeSevenTvFile(name: string): SevenTvHost['files'][number] {
  return {
    name,
    static_name: name,
    width: 32,
    height: 32,
    frame_count: 1,
    size: 0,
    format: 'webp',
  };
}

export function createPaintInput(overrides: {
  id: string;
  name: string;
  color?: number | null;
}): PaintData {
  return {
    id: overrides.id,
    name: overrides.name,
    color: overrides.color ?? null,
    function: 'LINEAR_GRADIENT',
    layers: emptyIndexedCollection,
    shadows: emptyIndexedCollection,
    textStyle: null,
    repeat: false,
    angle: 0,
    shape: 'circle',
    image_url: '',
    stops: emptyIndexedCollection,
  };
}

export function createBadgeData(overrides: Partial<BadgeData> = {}): BadgeData {
  const { host: hostOverrides, ...rest } = overrides;

  return {
    id: 'badge-id',
    name: 'Badge',
    tooltip: 'Tip',
    host: {
      url: hostOverrides?.url ?? 'https://cdn.7tv.app',
      files: hostOverrides?.files ?? [makeSevenTvFile('4x')],
    },
    ...rest,
  };
}

export function createBadgeCosmeticCreateData(
  badgeData: BadgeData = createBadgeData(),
): CosmeticCreateCallbackData {
  const cosmetic: BadgeCosmetic = {
    id: badgeData.id,
    kind: 1,
    object: {
      id: badgeData.id,
      kind: 'BADGE',
      data: badgeData,
    },
  };

  return {
    kind: 'BADGE',
    cosmetic,
  };
}

export function createPaintCosmeticCreateData(
  paintData: PaintData = createPaintInput({ id: 'paint-id', name: 'Paint' }),
): CosmeticCreateCallbackData {
  return {
    kind: 'PAINT',
    cosmetic: {
      id: paintData.id,
      kind: 1,
      object: {
        id: paintData.id,
        kind: 'PAINT',
        data: paintData,
      },
    },
  };
}

export function createEmptyChangeMap<T>(): ChangeMap<T> {
  return {
    id: 'change-1',
    kind: 1,
  };
}

function toPaintCosmetic(data: PaintData): PaintCosmetic {
  return {
    id: data.id,
    kind: 1,
    object: { id: data.id, kind: 'PAINT', data },
  };
}

function toBadgeCosmetic(data: BadgeData): BadgeCosmetic {
  return {
    id: data.id,
    kind: 1,
    object: { id: data.id, kind: 'BADGE', data },
  };
}

export function createPaintChangeEntry(
  paintData: PaintData,
  oldValue: PaintData = paintData,
): NonNullable<ChangeMap<PaintData>['updated']>[number] {
  return {
    key: 'data',
    index: 0,
    old_value: oldValue,
    value: paintData,
  };
}

export function createPaintPushedEntry(
  paintData: PaintData,
): NonNullable<ChangeMap<PaintData>['pushed']>[number] {
  return {
    key: 'data',
    index: 0,
    old_value: null,
    value: paintData,
  };
}

export function createBadgeChangeEntry(
  badgeData: BadgeData,
  oldValue: BadgeData = badgeData,
): NonNullable<ChangeMap<BadgeData>['updated']>[number] {
  return {
    key: 'data',
    index: 0,
    old_value: oldValue,
    value: badgeData,
  };
}

export function createBadgePushedEntry(
  badgeData: BadgeData,
): NonNullable<ChangeMap<BadgeData>['pushed']>[number] {
  return {
    key: 'data',
    index: 0,
    old_value: null,
    value: badgeData,
  };
}

export function createPaintCosmeticUpdateData(
  changes: ChangeMap<PaintData>,
): CosmeticUpdateCallbackData {
  const cosmeticChanges: ChangeMap<CosmeticCreate> = {
    id: changes.id,
    kind: changes.kind,
    updated: changes.updated?.map(entry => ({
      key: entry.key,
      index: entry.index,
      old_value: toPaintCosmetic(entry.old_value),
      value: toPaintCosmetic(entry.value),
    })),
    pushed: changes.pushed?.map(entry => ({
      key: entry.key,
      index: entry.index,
      old_value: null,
      value: toPaintCosmetic(entry.value),
    })),
  };

  return {
    kind: 'PAINT',
    changes: cosmeticChanges,
  };
}

export function createBadgeCosmeticUpdateData(
  changes: ChangeMap<BadgeData>,
): CosmeticUpdateCallbackData {
  const cosmeticChanges: ChangeMap<CosmeticCreate> = {
    id: changes.id,
    kind: changes.kind,
    updated: changes.updated?.map(entry => ({
      key: entry.key,
      index: entry.index,
      old_value: toBadgeCosmetic(entry.old_value),
      value: toBadgeCosmetic(entry.value),
    })),
    pushed: changes.pushed?.map(entry => ({
      key: entry.key,
      index: entry.index,
      old_value: null,
      value: toBadgeCosmetic(entry.value),
    })),
  };

  return {
    kind: 'BADGE',
    changes: cosmeticChanges,
  };
}

export function createEntitlementUpdateData(
  overrides: Partial<EntitlementUpdateCallbackData> = {},
): EntitlementUpdateCallbackData {
  return {
    changes: createEmptyChangeMap(),
    ttvUserId: null,
    paintId: null,
    badgeId: null,
    ...overrides,
  };
}

export function createEntitlementDeleteData(
  overrides: Partial<EntitlementDeleteCallbackData> = {},
): EntitlementDeleteCallbackData {
  return {
    entitlementId: 'entitlement-1',
    ttvUserId: null,
    ...overrides,
  };
}
