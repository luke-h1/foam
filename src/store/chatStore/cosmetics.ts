import { PaintRadialGradientShape } from '@app/graphql/generated/gql';
import {
  V4Badge,
  V4Paint,
  sevenTvService,
} from '@app/services/seventv-service';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import {
  type PaintData,
  type PaintFunction,
  type PaintShape,
  type PaintShadow,
} from '@app/utils/color/seventv-ws-service';
import { logger } from '@app/utils/logger';
import { batch } from '@legendapp/state';

import type { UserPaint } from './constants';
import { MAX_COSMETIC_ENTRIES } from './constants';
import { chatStore$ } from './state';

const packRgba = (color: {
  r: number;
  g: number;
  b: number;
  a: number;
}): number =>
  // eslint-disable-next-line no-bitwise
  (color.r << 24) | (color.g << 16) | (color.b << 8) | color.a | 0;

const convertV4PaintToPaintData = (paint: V4Paint): PaintData => {
  const firstLayer = paint.data.layers[0];
  const ty = firstLayer?.ty;
  let paintFunction: PaintFunction = 'LINEAR_GRADIENT';
  let angle = 0;
  let shape: PaintShape = 'circle';
  let repeat = false;
  let color: number | null = null;
  let imageUrl = '';

  const stopsIndexed: IndexedCollection<{ at: number; color: number }> = {
    length: 0,
  };
  // eslint-disable-next-line no-underscore-dangle
  switch (ty?.__typename) {
    case 'PaintLayerTypeLinearGradient':
      paintFunction = 'LINEAR_GRADIENT';
      angle = ty.angle;
      repeat = ty.repeating;
      ty.stops.forEach((stop, index) => {
        stopsIndexed[index] = { at: stop.at, color: packRgba(stop.color) };
      });
      stopsIndexed.length = ty.stops.length;
      break;

    case 'PaintLayerTypeRadialGradient':
      paintFunction = 'RADIAL_GRADIENT';
      repeat = ty.repeating;
      shape =
        ty.shape === PaintRadialGradientShape.Ellipse ? 'ellipse' : 'circle';
      ty.stops.forEach((stop, index) => {
        stopsIndexed[index] = { at: stop.at, color: packRgba(stop.color) };
      });
      stopsIndexed.length = ty.stops.length;
      break;

    case 'PaintLayerTypeSingleColor':
      color = packRgba(ty.color);
      break;

    case 'PaintLayerTypeImage':
      paintFunction = 'URL';
      imageUrl = ty.images[0]?.url ?? '';
      break;

    default:
      break;
  }
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

  return {
    id: paint.id,
    name: paint.name,
    color,
    function: paintFunction,
    repeat,
    angle,
    shape,
    image_url: imageUrl,
    stops: stopsIndexed,
    shadows: shadowsIndexed,
    gradients: { length: 0 },
    text: null,
  };
};

const convertV4BadgeToSanitised = (badge: V4Badge): SanitisedBadgeSet => {
  const bestImage =
    badge.images.find(img => img.scale === 4) ??
    badge.images.find(img => img.scale === 3) ??
    badge.images[0];

  return {
    id: badge.id,
    url: bestImage?.url ?? `https://cdn.7tv.app/badge/${badge.id}/4x.webp`,
    type: '7TV Badge',
    title: badge.description || badge.name,
    set: badge.id,
    provider: '7tv',
  };
};

export const fetchAndCacheUserCosmetics = async (
  sevenTvUserId: string,
): Promise<string | null> => {
  try {
    const cosmetics = await sevenTvService.getUserCosmeticsGql(sevenTvUserId);
    if (!cosmetics) {
      return null;
    }

    if (cosmetics.paint) {
      addPaint(convertV4PaintToPaintData(cosmetics.paint));
    }

    if (cosmetics.badge) {
      addBadge(convertV4BadgeToSanitised(cosmetics.badge));
    }

    if (cosmetics.ttvUserId) {
      if (cosmetics.paintId) {
        const cell = chatStore$.userPaintIds[cosmetics.ttvUserId];
        if (cell) {
          cell.set(cosmetics.paintId);
        }
      }

      if (cosmetics.badgeId) {
        const badgeCell = chatStore$.userBadgeIds[cosmetics.ttvUserId];
        if (badgeCell) {
          badgeCell.set(cosmetics.badgeId);
        }
      }
    }
    return cosmetics.ttvUserId;
  } catch (error) {
    logger.stvWs.error(
      `Error fetching cosmetics for user ${sevenTvUserId}:`,
      error,
    );
    return null;
  }
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

export const getUserPaint = (ttvUserId: string): UserPaint | undefined => {
  const paintId = chatStore$.userPaintIds[ttvUserId]?.peek();
  if (!paintId) {
    return undefined;
  }
  const paint = chatStore$.paints[paintId]?.peek();
  if (!paint) {
    return undefined;
  }
  return { ...paint, ttv_user_id: ttvUserId };
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

export const getBadge = (badgeId: string): SanitisedBadgeSet | undefined =>
  chatStore$.badges[badgeId]?.peek();

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
  return chatStore$.badges[badgeId]?.peek();
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

export const clearPaintsAndBadges = () => {
  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
    chatStore$.badges.set({});
    chatStore$.userBadgeIds.set({});
  });
};
