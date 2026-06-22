import {
  EmoteQueryDocument,
  type EmoteQueryQuery,
  type EmoteQueryQueryVariables,
  EmoteSetCustomDocument,
  type EmoteSetCustomQuery,
  type EmoteSetCustomQueryVariables,
  EmoteSetKind,
  GlobalEmoteSetDocument,
  type GlobalEmoteSetQuery,
  type Image,
  PaintsQueryDocument,
  type PaintsQueryQuery,
  Platform,
  UserByConnectionDocument,
  UserByConnectionQuery,
  UserCosmeticsDocument,
  UserCosmeticsQuery,
  UserPersonalEmotesQueryDocument,
  UserPersonalEmotesQueryQuery,
  UserPersonalEmotesQueryQueryVariables,
} from '@app/graphql/generated/gql';
import { storageService } from '@app/lib/storage';
import type {
  EmoteImageVariants,
  EmoteImageVariantSet,
  SevenTvEmoteSetMetadata,
  SevenTvSanitisedEmote,
} from '@app/types/emote';
import type { PaintData } from '@app/types/seventv/cosmetics';
import {
  convertV4PaintToPaintData,
  pickAnimatedFormat,
  pickBestFormat,
  pickBestImage,
  type V4Badge,
  type V4Paint,
} from '@app/utils/color/sevenTvPaintData';
import { createEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';
import { logger } from '@app/utils/logger';

import { sevenTvApi } from './api/clients';
import { sevenTvV4Client } from './gql/client';
import { runCosmeticsQuery } from './gql/sevenTvWorkletClient';

interface SevenTvFile {
  name: string;
  static_name: string;
  width: number;
  height: number;
  frame_count: number;
  size: number;
  format: string;
}

export interface SevenTvHost {
  url: string;
  files: SevenTvFile[];
}

export interface StvConnection {
  id: string;
  platform: 'TWITCH' | 'YOUTUBE' | 'KICK';
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id: string;
}

export interface StvUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  style: object;
  role_ids: string[];
  connection: StvConnection[];
}

export interface SevenTvEmote {
  id: string;
  name: string;
  flags: number;
  timestamp: number;
  actor_id: string;
  data: {
    id: string;
    name: string;
    flags: number;
    lifecycle: number;
    state: string[];
    listed: boolean;
    animated: boolean;
    tags?: string[];
    owner: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      style: {
        paint_id?: string;
        badge_id?: string;
        color?: number;
      };
      role_ids: string[];
      connection: StvConnection[];
      roles?: string[];
    };
    host: {
      url: string;
      files: SevenTvFile[];
    };
  };
}

interface StvEmoteSet {
  id: string;
  name: string;
  flags: number;
  immutable: boolean;
  privileged: boolean;
  emotes: SevenTvEmote[];
  emote_count: number;
  capacity: number;
  owner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    style: {
      color: number;
      badge_id: string;
      paint_id: string;
    };
    roles: string[];
  };
}

interface StvChannelEmotesResponse {
  id: string;
  platform: string;
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set: StvEmoteSet;
  user: {
    id: string;
    username: string;
    display_name: string;
    created_at: number;
    avatar_url: string;
  };
}

export interface SevenTvEmotePreview {
  id: string;
  name: string;
  owner: {
    display_name: string;
    username: string;
  } | null;
}

export interface UserCosmeticsInfo {
  userId: string;
  ttvUserId: string | null;
  paintId: string | null;
  badgeId: string | null;
  paint: V4Paint | null;
  badge: V4Badge | null;
}

const SEVEN_TV_USER_ID_CACHE_PREFIX = 'user-id:';
// Keep persisted 7TV user ID lookups for at most 12 hours before resolving again.
const SEVEN_TV_USER_ID_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const SEVEN_TV_USER_ID_NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000;
const SEVEN_TV_CACHE_NAMESPACE = 'seven_tv_cache';

type CachedSevenTvUserId = {
  expiresAt: number;
  userId: string;
};

const sevenTvUserIdRequests = new Map<string, Promise<string>>();

const getSevenTvUserIdStorageKey = (twitchUserId: string) =>
  `sevenTvUserId_${SEVEN_TV_USER_ID_CACHE_PREFIX}${twitchUserId}` as const;

function getCachedSevenTvUserId(twitchUserId: string): string | undefined {
  const cached = storageService.getString<CachedSevenTvUserId>(
    getSevenTvUserIdStorageKey(twitchUserId),
    SEVEN_TV_CACHE_NAMESPACE,
  );
  if (!cached) {
    return undefined;
  }
  return cached.userId;
}

function cacheSevenTvUserId(twitchUserId: string, userId: string) {
  const cached: CachedSevenTvUserId = {
    expiresAt:
      Date.now() +
      (userId
        ? SEVEN_TV_USER_ID_CACHE_TTL_MS
        : SEVEN_TV_USER_ID_NEGATIVE_CACHE_TTL_MS),
    userId,
  };

  storageService.set(
    getSevenTvUserIdStorageKey(twitchUserId),
    cached,
    SEVEN_TV_CACHE_NAMESPACE,
    { expiry: new Date(cached.expiresAt) },
  );
}

export const clearSevenTvUserIdCache = () => {
  sevenTvUserIdRequests.clear();
  storageService.clearNamespace(SEVEN_TV_CACHE_NAMESPACE, 'sevenTvUserId_');
};

function buildV4ImageVariants(images: readonly Image[]): EmoteImageVariants {
  const animated: EmoteImageVariantSet = {};
  const staticSet: EmoteImageVariantSet = {};

  for (const scale of ['1x', '2x', '3x', '4x'] as const) {
    const atScale = images.filter(image => `${image.scale}x` === scale);
    if (atScale.length === 0) {
      continue;
    }
    const animatedImage = pickAnimatedFormat(
      atScale.filter(image => image.frameCount > 1),
    );
    if (animatedImage) {
      animated[scale] = animatedImage.url;
    }
    const staticImage = pickBestFormat(
      atScale.filter(image => image.frameCount <= 1),
    );
    if (staticImage) {
      staticSet[scale] = staticImage.url;
    }
  }

  return createEmoteImageVariants({ animated, static: staticSet });
}

function pickBestStaticImage(images: readonly Image[]): Image | undefined {
  const scales = [4, 3, 2, 1];

  return scales.reduce<Image | undefined>((found, targetScale) => {
    if (found) {
      return found;
    }

    const atScale = images.filter(img => img.scale === targetScale);
    if (atScale.length === 0) {
      return undefined;
    }

    const staticImages = atScale.filter(img => img.frameCount <= 1);
    return staticImages.length > 0 ? pickBestFormat(staticImages) : undefined;
  }, undefined);
}

type V4EmoteSet = NonNullable<EmoteSetCustomQuery['emoteSets']['emoteSet']>;

function sanitiseV4EmoteSet(
  emoteSet: V4EmoteSet,
  site: '7TV Channel' | '7TV Global',
): SevenTvSanitisedEmote[] {
  const setMetadata: SevenTvEmoteSetMetadata = {
    setId: emoteSet.id,
    setName: emoteSet.name,
    capacity: emoteSet.capacity ?? null,
    ownerId: emoteSet.ownerId ?? null,
    kind: emoteSet.kind,
    updatedAt: emoteSet.updatedAt,
    totalCount: emoteSet.emotes.totalCount,
  };

  return emoteSet.emotes.items.map(item => {
    const { emote } = item;
    const bestImage = pickBestImage(emote.images);
    const bestStaticImage = pickBestStaticImage(emote.images);
    const imageVariants = buildV4ImageVariants(emote.images);
    const width = bestImage?.width ?? 0;
    const height = bestImage?.height ?? 0;
    const zeroWidth = item.flags.zeroWidth || emote.flags.defaultZeroWidth;

    return {
      name: item.alias,
      id: emote.id,
      url: bestImage?.url ?? '',
      static_url: bestStaticImage?.url,
      image_variants: imageVariants,
      flags: zeroWidth ? 256 : 0,
      original_name: emote.defaultName,
      creator: emote.owner?.mainConnection?.platformDisplayName ?? null,
      emote_link: `https://7tv.app/emotes/${emote.id}`,
      site,
      frame_count: bestImage?.frameCount ?? 1,
      format: bestImage?.mime?.replace('image/', '') ?? 'webp',
      aspect_ratio: height > 0 ? width / height : 1,
      zero_width: zeroWidth,
      width,
      height,
      set_metadata: setMetadata,
    };
  });
}

export const sevenTvService = {
  get7tvUserId: async (twitchUserId: string): Promise<string> => {
    const cached = getCachedSevenTvUserId(twitchUserId);
    if (cached !== undefined) {
      return cached;
    }

    const pending = sevenTvUserIdRequests.get(twitchUserId);
    if (pending) {
      return pending;
    }

    const request = (async () => {
      const { result, error } = await runCosmeticsQuery(
        UserByConnectionDocument,
        { platformId: twitchUserId },
        responseText => {
          'worklet';
          const parsed = JSON.parse(responseText) as {
            data?: UserByConnectionQuery;
            errors?: { message?: string }[];
          };
          if (parsed.errors?.length) {
            throw new Error(
              parsed.errors.flatMap(e => e.message ?? []).join('; ') ||
                '7TV GQL error',
            );
          }
          return parsed.data?.users?.userByConnection?.id ?? '';
        },
      );

      if (error) {
        logger.stv.warn(
          `Failed to resolve 7TV user for Twitch user ${twitchUserId}:`,
          {
            name: 'seven_tv_provider_warning',
            error,
            action: 'user_by_connection_failed',
            provider: 'seven_tv',
            resource_type: 'user',
            twitch_user_id: twitchUserId,
          },
        );
        return '';
      }

      const userId = result ?? '';
      cacheSevenTvUserId(twitchUserId, userId);
      return userId;
    })();

    sevenTvUserIdRequests.set(twitchUserId, request);
    try {
      return await request;
    } finally {
      sevenTvUserIdRequests.delete(twitchUserId);
    }
  },

  getEmoteSetId: async (twitchUserId: string): Promise<string> => {
    const result = await sevenTvApi.get<StvChannelEmotesResponse>(
      `/users/twitch/${twitchUserId}`,
    );

    if (!result.emote_set.id) {
      logger.stv.warn('7TV API returned no emote set ID', {
        name: 'seven_tv_emotes_warning',
        action: 'emote_set_id_missing',
        channel_id: twitchUserId,
        provider: 'seven_tv',
        resource_type: 'emotes',
        scope: 'channel',
      });
    }

    return result.emote_set.id;
  },

  getSanitisedEmoteSet: async (
    emoteSetId: string,
  ): Promise<SevenTvSanitisedEmote[]> => {
    if (emoteSetId === 'global') {
      const { data, error } = await sevenTvV4Client.query<GlobalEmoteSetQuery>({
        query: GlobalEmoteSetDocument,
      });

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      return sanitiseV4EmoteSet(data.emoteSets.global, '7TV Global');
    }

    const { data, error } = await sevenTvV4Client.query<
      EmoteSetCustomQuery,
      EmoteSetCustomQueryVariables
    >({
      query: EmoteSetCustomDocument,
      variables: { id: emoteSetId },
    });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    const emoteSet = data.emoteSets.emoteSet;
    if (!emoteSet) {
      return [];
    }

    return sanitiseV4EmoteSet(emoteSet, '7TV Channel');
  },

  getEmote: async (emoteId: string): Promise<SevenTvEmotePreview | null> => {
    const { data, error } = await sevenTvV4Client.query<
      EmoteQueryQuery,
      EmoteQueryQueryVariables
    >({
      query: EmoteQueryDocument,
      variables: { id: emoteId },
    });

    if (error) {
      throw error;
    }

    const emote = data?.emotes.emote;
    if (!emote) {
      return null;
    }

    const displayName = emote.owner?.mainConnection?.platformDisplayName;

    return {
      id: emote.id,
      name: emote.defaultName,
      owner: displayName
        ? {
            display_name: displayName,
            username: displayName,
          }
        : null,
    };
  },

  sendPresence: async (channelId: string, userId: string) => {
    return sevenTvApi.post(`/users/${userId}/presences`, {
      kind: 1,
      passive: true,
      session_id: '',
      data: {
        platform: 'TWITCH',
        id: String(channelId),
      },
    });
  },

  /**
   * Fetch a user's personal emote set via v4 GQL
   * Personal emotes are unique emotes that a user can use in any channel
   * @param twitchUserId - The Twitch user ID
   * @returns Array of sanitized emotes or empty array if no personal emotes
   */
  getPersonalEmoteSet: async (
    twitchUserId: string,
  ): Promise<SevenTvSanitisedEmote[]> => {
    const { data, error } = await sevenTvV4Client.query<
      UserPersonalEmotesQueryQuery,
      UserPersonalEmotesQueryQueryVariables
    >({
      query: UserPersonalEmotesQueryDocument,
      variables: { platformId: twitchUserId },
    });

    if (error) {
      logger.stv.warn(
        `Failed to fetch personal emotes for user ${twitchUserId}:`,
        {
          name: 'seven_tv_emotes_warning',
          error,
          action: 'personal_emotes_gql_failed',
          provider: 'seven_tv',
          resource_type: 'emotes',
          scope: 'personal',
          twitch_user_id: twitchUserId,
        },
      );
      return [];
    }

    const personalEmoteSet = data?.users?.userByConnection?.personalEmoteSet;

    if (!personalEmoteSet || !personalEmoteSet.emotes?.items?.length) {
      return [];
    }

    const setMetadata: SevenTvEmoteSetMetadata = {
      setId: personalEmoteSet.id,
      setName: personalEmoteSet.name,
      capacity: null,
      ownerId: null,
      kind: EmoteSetKind.Personal,
      updatedAt: '',
      totalCount: personalEmoteSet.emotes.items.length,
    };

    return personalEmoteSet.emotes.items.map(item => {
      const { emote } = item;
      const emoteName = item.alias || emote.defaultName;

      const bestImage = pickBestImage(emote.images);
      const bestStaticImage = pickBestStaticImage(emote.images);
      const imageVariants = buildV4ImageVariants(emote.images);

      const imgScale = bestImage?.scale ?? 1;
      const imgWidth = bestImage ? Math.round(bestImage.width / imgScale) : 0;
      const imgHeight = bestImage ? Math.round(bestImage.height / imgScale) : 0;

      return {
        name: emoteName,
        id: emote.id,
        url: bestImage?.url ?? '',
        static_url: bestStaticImage?.url,
        image_variants: imageVariants,
        flags: emote.flags.animated ? 1 : 0,
        original_name: emote.defaultName,
        creator: emote.owner?.mainConnection?.platformDisplayName ?? null,
        emote_link: `https://7tv.app/emotes/${emote.id}`,
        site: '7TV Personal',
        frame_count: bestImage?.frameCount ?? 1,
        format: bestImage?.mime?.replace('image/', '') ?? 'webp',
        aspect_ratio: imgHeight > 0 ? imgWidth / imgHeight : 1,
        zero_width: emote.flags.defaultZeroWidth,
        width: imgWidth,
        height: imgHeight,
        set_metadata: setMetadata,
      };
    });
  },

  /**
   * Fetch a user's full cosmetics (paint + badge data) via v4 GQL
   * Use this when you need the actual paint/badge styling data
   * @param sevenTvUserId - The 7TV user ID (not Twitch ID)
   */
  getUserCosmeticsGql: async (
    sevenTvUserId: string,
  ): Promise<UserCosmeticsInfo | null> => {
    const twitchPlatform = Platform.Twitch;
    try {
      const { result, error } = await runCosmeticsQuery(
        UserCosmeticsDocument,
        { id: sevenTvUserId },
        responseText => {
          'worklet';
          const parsed = JSON.parse(responseText) as {
            data?: UserCosmeticsQuery;
            errors?: { message?: string }[];
          };
          if (parsed.errors?.length) {
            throw new Error(
              parsed.errors.flatMap(e => e.message ?? []).join('; ') ||
                '7TV GQL error',
            );
          }
          const user = parsed.data?.users?.user;
          if (!user) {
            return null;
          }
          const twitchConnection = user.connections.find(
            conn => conn.platform === twitchPlatform,
          );
          const { style } = user;
          return {
            userId: user.id,
            ttvUserId: twitchConnection?.platformId ?? null,
            paintId: style.activePaintId ?? null,
            badgeId: style.activeBadgeId ?? null,
            paint: style.activePaint ?? null,
            badge: style.activeBadge ?? null,
          } satisfies UserCosmeticsInfo;
        },
      );

      if (error) {
        logger.stv.warn('Failed to fetch 7TV cosmetics', {
          name: 'seven_tv_cosmetics_warning',
          error,
          action: 'cosmetics_gql_failed',
          provider: 'seven_tv',
          resource_type: 'cosmetics',
          seven_tv_user_id: sevenTvUserId,
        });
        return null;
      }

      return result ?? null;
    } catch (error) {
      logger.stv.warn('Failed to fetch user cosmetics via GQL', {
        name: 'seven_tv_cosmetics_warning',
        error,
        action: 'cosmetics_fetch_failed',
        provider: 'seven_tv',
        resource_type: 'cosmetics',
        seven_tv_user_id: sevenTvUserId,
      });
      return null;
    }
  },

  fetchAllPaints: async (): Promise<PaintData[]> => {
    const { data, error } = await sevenTvV4Client.query<PaintsQueryQuery>({
      query: PaintsQueryDocument,
    });

    if (error) {
      throw error;
    }

    const paints = data?.paints?.paints ?? [];

    return paints
      .map(convertV4PaintToPaintData)
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  },
} as const;
