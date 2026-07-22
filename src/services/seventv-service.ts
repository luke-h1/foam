import {
  BadgesQueryDocument,
  type BadgesQueryQuery,
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
import type {
  EmoteImageVariants,
  EmoteImageVariantSet,
  SevenTvEmoteSetMetadata,
  SevenTvSanitisedEmote,
} from '@app/types/emote';
import type {
  PaintData,
  SevenTvEventData,
  SevenTvEventType,
  UserCosmeticsInfo,
} from '@app/types/seventv/cosmetics';
import type {
  SevenTvEmote,
  SevenTvEmotePreview,
} from '@app/types/seventv/emotes';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { convertV4PaintToPaintData } from '@app/utils/color/sevenTvPaintData/convertV4PaintToPaintData';
import { pickAnimatedFormat } from '@app/utils/color/sevenTvPaintData/pickAnimatedFormat';
import { pickBestFormat } from '@app/utils/color/sevenTvPaintData/pickBestFormat';
import { pickBestImage } from '@app/utils/color/sevenTvPaintData/pickBestImage';
import { createEmoteImageVariants } from '@app/utils/emote/emoteImageVariants/createEmoteImageVariants';
import { logger } from '@app/utils/logger';
import { sevenTvUserIdCache } from '@app/utils/seventv/sevenTvUserIdCache';

import { sevenTvApi } from './api/clients';
import { sevenTvV4Client } from './gql/client';
import { runCosmeticsQuery } from './gql/sevenTvWorkletClient';

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

export const clearSevenTvUserIdCache = () => {
  sevenTvUserIdCache.clear();
};

async function fetchSevenTvUserId(
  twitchUserId: string,
): Promise<string | null> {
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
    return null;
  }

  return result ?? '';
}

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

  const sanitisedEmotes: SevenTvSanitisedEmote[] = [];
  for (const item of emoteSet.emotes.items) {
    const { emote } = item;
    const bestImage = pickBestImage(emote.images);
    const bestStaticImage = pickBestStaticImage(emote.images);
    const imageVariants = buildV4ImageVariants(emote.images);
    const width = bestImage?.width ?? 0;
    const height = bestImage?.height ?? 0;
    const zeroWidth = item.flags.zeroWidth || emote.flags.defaultZeroWidth;

    const sanitised: SevenTvSanitisedEmote = {
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
    if (hasRenderableUrl(sanitised)) {
      sanitisedEmotes.push(sanitised);
    }
  }
  return sanitisedEmotes;
}

function hasRenderableUrl(emote: { url: string }): boolean {
  return emote.url !== '';
}

export const sevenTvService = {
  get7tvUserId: async (twitchUserId: string): Promise<string> =>
    sevenTvUserIdCache.resolve(twitchUserId, fetchSevenTvUserId),

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

  /**
   * Bulk EventAPI bridge lookup. Identifiers must be Twitch logins as
   * `username:<login>`; numeric `id:` identifiers are rejected by the API.
   *
   * The live endpoint only synthesises `cosmetic.create` AVATAR dispatches for
   * users with an active profile picture. It does not replay paint, badge, or
   * entitlement events, so this cannot backfill chat cosmetics.
   */
  fetchBridgedCosmetics: async (
    twitchLogins: string[],
  ): Promise<SevenTvEventData<SevenTvEventType>[]> => {
    if (twitchLogins.length === 0) {
      return [];
    }
    const events = await sevenTvApi.post<SevenTvEventData<SevenTvEventType>[]>(
      '/bridge/event-api',
      { identifiers: twitchLogins.map(login => `username:${login}`) },
    );
    return Array.isArray(events) ? events : [];
  },

  /**
   * Write a presence for the user in a channel.
   *
   * Passive presence (with the EventAPI session id) makes 7TV push the user's
   * own entitlements to just that session. Active presence (passive: false)
   * makes 7TV broadcast the user's entitlements to every client subscribed to
   * the channel, which is how other viewers see this user's cosmetics.
   */
  sendPresence: async (
    channelId: string,
    userId: string,
    options: { passive: boolean; sessionId?: string },
  ) => {
    return sevenTvApi.post(`/users/${userId}/presences`, {
      kind: 1,
      passive: options.passive,
      /**
       * Coalesce so a missing EventAPI session still serialises the field;
       * JSON.stringify drops undefined and 7TV expects session_id on
       * passive presence.
       */
      session_id: options.passive ? (options.sessionId ?? '') : undefined,
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

    const sanitisedEmotes: SevenTvSanitisedEmote[] = [];
    for (const item of personalEmoteSet.emotes.items) {
      const { emote } = item;
      const emoteName = item.alias || emote.defaultName;

      const bestImage = pickBestImage(emote.images);
      const bestStaticImage = pickBestStaticImage(emote.images);
      const imageVariants = buildV4ImageVariants(emote.images);

      const imgScale = bestImage?.scale ?? 1;
      const imgWidth = bestImage ? Math.round(bestImage.width / imgScale) : 0;
      const imgHeight = bestImage ? Math.round(bestImage.height / imgScale) : 0;

      const sanitised: SevenTvSanitisedEmote = {
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
      if (hasRenderableUrl(sanitised)) {
        sanitisedEmotes.push(sanitised);
      }
    }
    return sanitisedEmotes;
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

  fetchAllBadges: async (): Promise<SanitisedBadgeSet[]> => {
    const { data, error } = await sevenTvV4Client.query<BadgesQueryQuery>({
      query: BadgesQueryDocument,
    });

    if (error) {
      throw error;
    }

    return (data?.badges?.badges ?? [])
      .flatMap<SanitisedBadgeSet>(badge => {
        const url = pickBestImage(badge.images)?.url;
        return url
          ? [
              {
                id: badge.id,
                url,
                title: badge.name,
                type: '7TV Badge',
                set: badge.id,
                provider: '7tv',
              },
            ]
          : [];
      })
      .sort((a, b) => a.title.localeCompare(b.title, 'en'));
  },
} as const;
