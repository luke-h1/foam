import type {
  CosmeticCreateCallbackData,
  CosmeticUpdateCallbackData,
  EntitlementDeleteCallbackData,
  EntitlementUpdateCallbackData,
} from '@app/hooks/useSeventvWs';
import type { SevenTvHost } from '@app/services/seventv-service';
import type {
  BadgeCosmetic,
  BadgeData,
  ChangeMap,
  CosmeticCreate,
  PaintData,
} from '@app/types/seventv/cosmetics';

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

type CosmeticChangeEntry<TData> = {
  key: string;
  index: number;
  old_value: TData | null;
  value: { object: { data: TData } };
};

export function createPaintChangeEntry(
  paintData: PaintData,
  oldValue: PaintData | null = paintData,
): NonNullable<ChangeMap<PaintData>['updated']>[number] {
  const entry: CosmeticChangeEntry<PaintData> = {
    key: 'data',
    index: 0,
    old_value: oldValue,
    value: { object: { data: paintData } },
  };

  return entry as unknown as NonNullable<
    ChangeMap<PaintData>['updated']
  >[number];
}

export function createPaintPushedEntry(
  paintData: PaintData,
): NonNullable<ChangeMap<PaintData>['pushed']>[number] {
  const entry: CosmeticChangeEntry<PaintData> = {
    key: 'data',
    index: 0,
    old_value: null,
    value: { object: { data: paintData } },
  };

  return entry as unknown as NonNullable<
    ChangeMap<PaintData>['pushed']
  >[number];
}

export function createBadgeChangeEntry(
  badgeData: BadgeData,
  oldValue: BadgeData | null = badgeData,
): NonNullable<ChangeMap<BadgeData>['updated']>[number] {
  const entry: CosmeticChangeEntry<BadgeData> = {
    key: 'data',
    index: 0,
    old_value: oldValue,
    value: { object: { data: badgeData } },
  };

  return entry as unknown as NonNullable<
    ChangeMap<BadgeData>['updated']
  >[number];
}

export function createBadgePushedEntry(
  badgeData: BadgeData,
): NonNullable<ChangeMap<BadgeData>['pushed']>[number] {
  const entry: CosmeticChangeEntry<BadgeData> = {
    key: 'data',
    index: 0,
    old_value: null,
    value: { object: { data: badgeData } },
  };

  return entry as unknown as NonNullable<
    ChangeMap<BadgeData>['pushed']
  >[number];
}

export function createPaintCosmeticUpdateData(
  changes: ChangeMap<PaintData>,
): CosmeticUpdateCallbackData {
  return {
    kind: 'PAINT',
    changes: changes as unknown as ChangeMap<CosmeticCreate>,
  };
}

export function createBadgeCosmeticUpdateData(
  changes: ChangeMap<BadgeData>,
): CosmeticUpdateCallbackData {
  return {
    kind: 'BADGE',
    changes: changes as unknown as ChangeMap<CosmeticCreate>,
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
