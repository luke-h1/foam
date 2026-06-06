import {
  buildSevenTvBadgeImageUrl,
  normalizeSevenTvBadge,
  normalizeSevenTvPaint,
  type PaintGradientLayer,
} from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import { PaintRadialGradientShape } from '@app/graphql/generated/gql';
import { storageService } from '@app/lib/storage';
import {
  V4Badge,
  V4Paint,
  clearSevenTvUserIdCache,
  pickBestImage,
  sevenTvService,
} from '@app/services/seventv-service';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type {
  PaintData,
  PaintShadow,
} from '@app/utils/color/seventv-ws-service';
import { logger } from '@app/utils/logger';
import { batch } from '@legendapp/state';

import { MAX_COSMETIC_ENTRIES } from './constants';
import { chatStore$ } from './state';

const USER_COSMETICS_CACHE_PREFIX = 'user-cosmetics:';
// Keep persisted 7TV user cosmetics for at most 12 hours before refetching.
const USER_COSMETICS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const USER_COSMETICS_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;
const SEVEN_TV_CACHE_NAMESPACE = 'seven_tv_cache';

type CachedUserCosmetics = {
  badge?: SanitisedBadgeSet;
  badgeId: string | null;
  expiresAt: number;
  paint?: PaintData;
  paintId: string | null;
  ttvUserId: string | null;
};

const userCosmeticsRequests = new Map<string, Promise<string | null>>();

const getUserCosmeticsStorageKey = (sevenTvUserId: string) =>
  `sevenTvUserCosmetics_${USER_COSMETICS_CACHE_PREFIX}${sevenTvUserId}` as const;

const packRgba = (color: {
  r: number;
  g: number;
  b: number;
  a: number;
}): number =>
  // eslint-disable-next-line no-bitwise
  ((color.r << 24) | (color.g << 16) | (color.b << 8) | color.a) >>> 0;

const convertV4Layer = (
  layer: V4Paint['data']['layers'][number],
): PaintGradientLayer | null => {
  const { ty } = layer;
  // eslint-disable-next-line no-underscore-dangle
  switch (ty.__typename) {
    case 'PaintLayerTypeLinearGradient':
      return {
        function: 'LINEAR_GRADIENT',
        angle: ty.angle,
        repeat: ty.repeating,
        stops: ty.stops.map(stop => ({
          at: stop.at,
          color: packRgba(stop.color),
        })),
        canvas_repeat: '',
        size: [1, 1],
      };
    case 'PaintLayerTypeRadialGradient':
      return {
        function: 'RADIAL_GRADIENT',
        repeat: ty.repeating,
        shape:
          ty.shape === PaintRadialGradientShape.Ellipse ? 'ellipse' : 'circle',
        stops: ty.stops.map(stop => ({
          at: stop.at,
          color: packRgba(stop.color),
        })),
        canvas_repeat: '',
        size: [1, 1],
      };
    case 'PaintLayerTypeSingleColor': {
      const packed = packRgba(ty.color);
      return {
        function: 'LINEAR_GRADIENT',
        stops: [
          { at: 0, color: packed },
          { at: 1, color: packed },
        ],
        canvas_repeat: '',
        size: [1, 1],
      };
    }
    case 'PaintLayerTypeImage':
      return {
        function: 'URL',
        image_url: pickBestImage(ty.images)?.url ?? '',
        stops: [],
        canvas_repeat: '',
        size: [1, 1],
      };
    default:
      return null;
  }
};

export type SevenTvPaintSource = Pick<V4Paint, 'id' | 'name' | 'data'>;

export const convertV4PaintToPaintData = (
  paint: SevenTvPaintSource,
): PaintData => {
  const gradients = paint.data.layers
    .map(convertV4Layer)
    .filter((layer): layer is PaintGradientLayer => layer !== null);

  const singleColorLayer = paint.data.layers.find(
    layer => layer.ty.__typename === 'PaintLayerTypeSingleColor',
  );
  const color =
    singleColorLayer?.ty.__typename === 'PaintLayerTypeSingleColor'
      ? packRgba(singleColorLayer.ty.color)
      : null;

  const shadowsIndexed: IndexedCollection<PaintShadow> = {
    length: paint.data.shadows.length,
  };

  paint.data.shadows.forEach((shadow, index) => {
    shadowsIndexed[index] = {
      color: packRgba(shadow.color),
      radius: shadow.blur,
      x_offset: shadow.offsetX,
      y_offset: shadow.offsetY,
    };
  });

  return normalizeSevenTvPaint({
    id: paint.id,
    name: paint.name,
    color,
    gradients,
    shadows: shadowsIndexed,
  });
};

const convertV4BadgeToSanitised = (badge: V4Badge): SanitisedBadgeSet => {
  const bestImage =
    badge.images.find(img => img.scale === 4) ??
    badge.images.find(img => img.scale === 3) ??
    badge.images[0];

  return normalizeSevenTvBadge({
    id: badge.id,
    url: bestImage?.url ?? buildSevenTvBadgeImageUrl(badge.id),
    type: '7TV Badge',
    title: badge.description || badge.name,
    set: badge.id,
    provider: '7tv',
  });
};

function applyCachedUserCosmetics(cosmetics: CachedUserCosmetics) {
  batch(() => {
    if (cosmetics.paint) {
      addPaint(cosmetics.paint);
    }

    if (cosmetics.badge) {
      addBadge(cosmetics.badge);
    }

    if (cosmetics.ttvUserId) {
      if (cosmetics.paintId) {
        setUserPaint(cosmetics.ttvUserId, cosmetics.paintId);
      }

      if (cosmetics.badgeId) {
        setUserBadge(cosmetics.ttvUserId, cosmetics.badgeId);
      }
    }
  });
}

function getCachedUserCosmetics(
  sevenTvUserId: string,
): CachedUserCosmetics | undefined {
  return (
    storageService.getString<CachedUserCosmetics>(
      getUserCosmeticsStorageKey(sevenTvUserId),
      SEVEN_TV_CACHE_NAMESPACE,
    ) ?? undefined
  );
}

function setCachedUserCosmetics(
  sevenTvUserId: string,
  cosmetics: CachedUserCosmetics,
) {
  storageService.set(
    getUserCosmeticsStorageKey(sevenTvUserId),
    cosmetics,
    SEVEN_TV_CACHE_NAMESPACE,
    { expiry: new Date(cosmetics.expiresAt) },
  );
}

export const fetchAndCacheUserCosmetics = async (
  sevenTvUserId: string,
): Promise<string | null> => {
  const cached = getCachedUserCosmetics(sevenTvUserId);
  if (cached) {
    applyCachedUserCosmetics(cached);
    return cached.ttvUserId;
  }

  const pending = userCosmeticsRequests.get(sevenTvUserId);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    try {
      const cosmetics = await sevenTvService.getUserCosmeticsGql(sevenTvUserId);
      if (!cosmetics) {
        return null;
      }

      const paint = cosmetics.paint
        ? convertV4PaintToPaintData(cosmetics.paint)
        : undefined;
      const badge = cosmetics.badge
        ? convertV4BadgeToSanitised(cosmetics.badge)
        : undefined;
      const cachedCosmetics: CachedUserCosmetics = {
        badge,
        badgeId: cosmetics.badgeId,
        expiresAt:
          Date.now() +
          (paint || badge
            ? USER_COSMETICS_CACHE_TTL_MS
            : USER_COSMETICS_NEGATIVE_CACHE_TTL_MS),
        paint,
        paintId: cosmetics.paintId,
        ttvUserId: cosmetics.ttvUserId,
      };

      setCachedUserCosmetics(sevenTvUserId, cachedCosmetics);
      applyCachedUserCosmetics(cachedCosmetics);
      return cosmetics.ttvUserId;
    } catch (error) {
      logger.stvWs.error(
        `Error fetching cosmetics for user ${sevenTvUserId}:`,
        error,
      );
      return null;
    }
  })();

  userCosmeticsRequests.set(sevenTvUserId, request);
  try {
    return await request;
  } finally {
    userCosmeticsRequests.delete(sevenTvUserId);
  }
};

export const clearUserCosmeticsCache = () => {
  userCosmeticsRequests.clear();
  clearSevenTvUserIdCache();
  storageService.clearNamespace(
    SEVEN_TV_CACHE_NAMESPACE,
    'sevenTvUserCosmetics_',
  );
  clearPaintsAndBadges();
};

export const setUserPaint = (ttvUserId: string, paintId: string): void => {
  const current = chatStore$.userPaintIds.peek();
  const entries = Object.keys(current);

  if (entries.length >= MAX_COSMETIC_ENTRIES) {
    const trimCount = Math.floor(MAX_COSMETIC_ENTRIES * 0.2);
    const trimmed = Object.fromEntries(
      Object.entries(current).slice(trimCount),
    );

    chatStore$.userPaintIds.set({ ...trimmed, [ttvUserId]: paintId });
  } else {
    chatStore$.userPaintIds.set({ ...current, [ttvUserId]: paintId });
  }
};

export const addPaint = (paint: PaintData) => {
  if (paint.id) {
    const cell = chatStore$.paints[paint.id];
    cell?.set(paint);
  }
};

export const getPaint = (paintId: string): PaintData | undefined =>
  chatStore$.paints[paintId]?.peek();

export const addBadge = (badge: SanitisedBadgeSet) => {
  if (badge.id) {
    const cell = chatStore$.badges[badge.id];
    cell?.set(badge);
  }
};

export const getBadge = (badgeId: string): SanitisedBadgeSet | undefined => {
  const badge = chatStore$.badges[badgeId]?.peek();
  if (!badge) {
    return undefined;
  }
  return normalizeSevenTvBadge(badge);
};

export const setUserBadge = (ttvUserId: string, badgeId: string): void => {
  const current = chatStore$.userBadgeIds.peek();
  const entries = Object.keys(current);

  if (entries.length >= MAX_COSMETIC_ENTRIES) {
    const trimCount = Math.floor(MAX_COSMETIC_ENTRIES * 0.2);
    const trimmed = Object.fromEntries(
      Object.entries(current).slice(trimCount),
    );

    chatStore$.userBadgeIds.set({ ...trimmed, [ttvUserId]: badgeId });
  } else {
    chatStore$.userBadgeIds.set({ ...current, [ttvUserId]: badgeId });
  }
};

export const getUserBadge = (
  ttvUserId: string,
): SanitisedBadgeSet | undefined => {
  const badgeId = chatStore$.userBadgeIds[ttvUserId]?.peek();
  if (!badgeId) {
    return undefined;
  }
  return getBadge(badgeId);
};

export const updateBadge = (badge: SanitisedBadgeSet) => {
  if (badge.id) {
    const cell = chatStore$.badges[badge.id];
    cell?.set(badge);
  }
};

export const removeBadge = (badgeId: string) => {
  const currentBadges = chatStore$.badges.peek();
  const { [badgeId]: _, ...remainingBadges } = currentBadges;
  chatStore$.badges.set(remainingBadges);
  const currentUserBadgeIds = chatStore$.userBadgeIds.peek();

  chatStore$.userBadgeIds.set(
    Object.fromEntries(
      Object.entries(currentUserBadgeIds).filter(
        ([, userBadgeId]) => userBadgeId !== badgeId,
      ),
    ),
  );
};

export const removeUserBadge = (ttvUserId: string) => {
  const current = chatStore$.userBadgeIds.peek();
  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userBadgeIds.set(rest);
};

export const updatePaint = (paint: PaintData) => {
  if (paint.id) {
    const cell = chatStore$.paints[paint.id];
    cell?.set(paint);
  }
};

export const removePaint = (paintId: string) => {
  const currentPaints = chatStore$.paints.peek();
  const { [paintId]: _, ...remainingPaints } = currentPaints;
  chatStore$.paints.set(remainingPaints);
  chatStore$.userPaintIds.set(
    Object.fromEntries(
      Object.entries(chatStore$.userPaintIds.peek()).filter(
        ([, id]) => id !== paintId,
      ),
    ),
  );
};

export const removeUserPaint = (ttvUserId: string) => {
  const current = chatStore$.userPaintIds.peek();
  const { [ttvUserId]: _, ...rest } = current;
  chatStore$.userPaintIds.set(rest);
};

export const clearPaints = () => {
  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
  });
};

export const clearSevenTvBadges = () => {
  batch(() => {
    chatStore$.badges.set({});
    chatStore$.userBadgeIds.set({});
  });
};

const clearPaintsAndBadges = () => {
  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
    chatStore$.badges.set({});
    chatStore$.userBadgeIds.set({});
  });
};
