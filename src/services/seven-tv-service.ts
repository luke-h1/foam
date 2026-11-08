import { SEVEN_TV_GLOBAL_EMOTE_SET_ID } from '@app/constants/emote-providers';
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
  Platform,
  UserByConnectionDocument,
  type UserByConnectionQuery,
  type UserByConnectionQueryVariables,
  UserCosmeticsDocument,
  type UserCosmeticsQuery,
  type UserCosmeticsQueryVariables,
  UserPersonalEmotesQueryDocument,
  type UserPersonalEmotesQueryQuery,
  type UserPersonalEmotesQueryQueryVariables,
} from '@app/graphql/generated/gql';
import type {
  EmoteImageVariants,
  EmoteImageVariantSet,
  SevenTvEmoteSetMetadata,
  SevenTvSanitisedEmote,
} from '@app/types/emote';
import type { SevenTvEmotePreview } from '@app/types/seven-tv/emotes';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createEmoteImageVariants } from '@app/utils/emote/emote-image-variants/createEmoteImageVariants';
import { buildSevenTvSanitisedEmote } from '@app/utils/emote/sanitised/buildSevenTvSanitisedEmote';
import { sanitiseAll } from '@app/utils/emote/sanitised/sanitiseAll';
import { logger } from '@app/utils/logger';
import { SEVEN_TV_ZERO_WIDTH_FLAG } from '@app/utils/seven-tv/constants';
import { pickAnimatedFormat } from '@app/utils/seven-tv/gql/pickAnimatedFormat';
import { pickBestFormat } from '@app/utils/seven-tv/gql/pickBestFormat';
import { pickBestImage } from '@app/utils/seven-tv/gql/pickBestImage';
import { sanitiseV4Badge } from '@app/utils/seven-tv/gql/sanitiseV4Badge';
import type { UserCosmeticsInfo } from '@app/utils/seven-tv/gql/types';
import {
  SEVEN_TV_EMOTE_SET_MAX_AGE_MS,
  type SevenTvUser,
  sevenTvUserCache,
} from '@app/utils/seven-tv/sevenTvUserCache';

import { sevenTvApi } from './api/clients';
import { sevenTvV4Client } from './gql/client';

export const clearSevenTvUserCache = () => {
  sevenTvUserCache.clear();
};

/**
 * Called when the EventAPI reports a channel switching emote set, so the next
 * channel load does not resolve the set it just replaced.
 */
export const invalidateSevenTvUser = (twitchUserId: string) => {
  sevenTvUserCache.invalidate(twitchUserId);
};

function toSevenTvUser(data: UserByConnectionQuery): SevenTvUser {
  'worklet';

  const user = data.users?.userByConnection;

  return {
    userId: user?.id ?? '',
    emoteSetId: user?.style?.activeEmoteSetId ?? '',
  };
}

async function fetchSevenTvUser(
  twitchUserId: string,
): Promise<SevenTvUser | null> {
  const { data, error } = await sevenTvV4Client.queryDerived<
    UserByConnectionQuery,
    SevenTvUser,
    UserByConnectionQueryVariables
  >({
    query: UserByConnectionDocument,
    variables: { platformId: twitchUserId },
    derive: toSevenTvUser,
  });

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

  return data ?? { userId: '', emoteSetId: '' };
}

// The emote set helpers below are worklets so the channel set can be sanitised
// on the background parse runtime. Keep each one above its callers: the
// worklets plugin assigns them in place, so a caller declared first captures
// `undefined`.

function buildV4ImageVariants(images: readonly Image[]): EmoteImageVariants {
  'worklet';

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

type V4EmoteSet = NonNullable<EmoteSetCustomQuery['emoteSets']['emoteSet']>;

type V4PersonalEmoteSet = NonNullable<
  NonNullable<
    UserPersonalEmotesQueryQuery['users']['userByConnection']
  >['personalEmoteSet']
>;

/**
 * The fields of an emote set item that the set query and the personal set
 * query both return. Only the set query sends the per-item flags.
 */
interface V4EmoteSetEntry {
  alias: string;
  flags?: { zeroWidth: boolean };
  emote: {
    id: string;
    defaultName: string;
    images: readonly Image[];
    flags: { defaultZeroWidth: boolean };
    owner?: {
      mainConnection?: { platformDisplayName: string } | null;
    } | null;
  };
}

function sanitiseV4EmoteSetItems(
  items: readonly V4EmoteSetEntry[],
  site: SevenTvSanitisedEmote['site'],
  setMetadata: SevenTvEmoteSetMetadata,
): SevenTvSanitisedEmote[] {
  'worklet';

  return sanitiseAll(items, item => {
    const { emote } = item;
    const bestImage = pickBestImage(emote.images);
    const bestStaticImage = pickBestImage(emote.images, { staticOnly: true });
    const width = bestImage?.width ?? 0;
    const height = bestImage?.height ?? 0;
    const zeroWidth =
      item.flags?.zeroWidth === true || emote.flags.defaultZeroWidth;

    return buildSevenTvSanitisedEmote({
      site,
      id: emote.id,
      name: item.alias || emote.defaultName,
      originalName: emote.defaultName,
      creator: emote.owner?.mainConnection?.platformDisplayName ?? null,
      url: bestImage?.url ?? '',
      staticUrl: bestStaticImage?.url,
      imageVariants: buildV4ImageVariants(emote.images),
      flags: zeroWidth ? SEVEN_TV_ZERO_WIDTH_FLAG : 0,
      frameCount: bestImage?.frameCount ?? 1,
      format: bestImage?.mime?.replace('image/', '') ?? 'webp',
      aspectRatio: height > 0 ? width / height : 1,
      zeroWidth,
      width,
      height,
      setMetadata,
      actor: undefined,
    });
  });
}

function sanitiseV4EmoteSet(
  emoteSet: V4EmoteSet,
  site: '7TV Channel' | '7TV Global',
): SevenTvSanitisedEmote[] {
  'worklet';

  return sanitiseV4EmoteSetItems(emoteSet.emotes.items, site, {
    setId: emoteSet.id,
    setName: emoteSet.name,
    capacity: emoteSet.capacity ?? null,
    ownerId: emoteSet.ownerId ?? null,
    kind: emoteSet.kind,
    updatedAt: emoteSet.updatedAt,
    totalCount: emoteSet.emotes.totalCount,
  });
}

function sanitisePersonalEmoteSet(
  emoteSet: V4PersonalEmoteSet,
): SevenTvSanitisedEmote[] {
  return sanitiseV4EmoteSetItems(emoteSet.emotes.items, '7TV Personal', {
    setId: emoteSet.id,
    setName: emoteSet.name,
    capacity: null,
    ownerId: null,
    kind: EmoteSetKind.Personal,
    updatedAt: '',
    totalCount: emoteSet.emotes.items.length,
  });
}

function sanitiseGlobalEmoteSetResponse(
  data: GlobalEmoteSetQuery,
): SevenTvSanitisedEmote[] {
  'worklet';

  return sanitiseV4EmoteSet(data.emoteSets.global, '7TV Global');
}

function sanitiseChannelEmoteSetResponse(
  data: EmoteSetCustomQuery,
): SevenTvSanitisedEmote[] {
  'worklet';

  const emoteSet = data.emoteSets.emoteSet;
  return emoteSet ? sanitiseV4EmoteSet(emoteSet, '7TV Channel') : [];
}

const TWITCH_PLATFORM = Platform.Twitch;

function toUserCosmeticsInfo(
  data: UserCosmeticsQuery,
): UserCosmeticsInfo | null {
  'worklet';

  const user = data.users?.user;

  if (!user) {
    return null;
  }

  const twitchConnection = user.connections.find(
    conn => conn.platform === TWITCH_PLATFORM,
  );

  const { style } = user;

  return {
    userId: user.id,
    ttvUserId: twitchConnection?.platformId ?? null,
    paintId: style.activePaintId ?? null,
    badgeId: style.activeBadgeId ?? null,
    paint: style.activePaint ?? null,
    badge: style.activeBadge ?? null,
  };
}

async function fetchGlobalSevenTvEmoteSet(): Promise<SevenTvSanitisedEmote[]> {
  const { data, error } = await sevenTvV4Client.queryDerived({
    query: GlobalEmoteSetDocument,
    derive: sanitiseGlobalEmoteSetResponse,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export const sevenTvService = {
  get7tvUserId: async (twitchUserId: string): Promise<string> =>
    (await sevenTvUserCache.resolve(twitchUserId, fetchSevenTvUser))?.userId ??
    '',

  /**
   * Shares the cached userByConnection lookup with get7tvUserId. Throws when
   * the channel has no 7TV account; `loadChannelResources` catches it and
   * falls back.
   */
  getEmoteSetId: async (twitchUserId: string): Promise<string> => {
    const user = await sevenTvUserCache.resolve(
      twitchUserId,
      fetchSevenTvUser,
      { maxAgeMs: SEVEN_TV_EMOTE_SET_MAX_AGE_MS },
    );

    if (!user?.userId) {
      throw new Error(`No 7TV user for Twitch user ${twitchUserId}`);
    }

    if (!user.emoteSetId) {
      logger.stv.warn('7TV user has no active emote set', {
        name: 'seven_tv_emotes_warning',
        action: 'emote_set_id_missing',
        channel_id: twitchUserId,
        provider: 'seven_tv',
        resource_type: 'emotes',
        scope: 'channel',
      });
    }

    return user.emoteSetId;
  },

  getSanitisedEmoteSet: async (
    emoteSetId: string,
  ): Promise<SevenTvSanitisedEmote[]> => {
    if (emoteSetId === SEVEN_TV_GLOBAL_EMOTE_SET_ID) {
      return fetchGlobalSevenTvEmoteSet();
    }

    // A full channel set is ~3MB of JSON. Sanitising on the parse runtime
    // means the JS thread rebuilds only the compact emotes, not the raw tree.
    const { data, error } = await sevenTvV4Client.queryDerived<
      EmoteSetCustomQuery,
      SevenTvSanitisedEmote[],
      EmoteSetCustomQueryVariables
    >({
      query: EmoteSetCustomDocument,
      variables: { id: emoteSetId },
      derive: sanitiseChannelEmoteSetResponse,
    });

    if (error) {
      throw error;
    }

    return data ?? [];
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
   * Passive presence pushes entitlements to just this session; active
   * (passive: false) broadcasts them so other viewers see the cosmetics.
   */
  sendPresence: async (
    channelId: string,
    userId: string,
    options: { passive: boolean; sessionId?: string },
  ) => {
    return sevenTvApi.post(`/users/${userId}/presences`, {
      kind: 1,
      passive: options.passive,
      // JSON.stringify drops undefined and 7TV expects session_id on passive presence.
      session_id: options.passive ? (options.sessionId ?? '') : undefined,
      data: {
        platform: 'TWITCH',
        id: String(channelId),
      },
    });
  },

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

    return sanitisePersonalEmoteSet(personalEmoteSet);
  },

  /**
   * A user's full cosmetics (paint + badge styling data) via v4 GQL. Takes
   * the 7TV user id, not the Twitch id.
   */
  getUserCosmeticsGql: async (
    sevenTvUserId: string,
  ): Promise<UserCosmeticsInfo | null> => {
    const { data, error } = await sevenTvV4Client.queryDerived<
      UserCosmeticsQuery,
      UserCosmeticsInfo | null,
      UserCosmeticsQueryVariables
    >({
      query: UserCosmeticsDocument,
      variables: { id: sevenTvUserId },
      derive: toUserCosmeticsInfo,
    });

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

    return data ?? null;
  },

  fetchAllBadges: async (): Promise<SanitisedBadgeSet[]> => {
    const { data, error } = await sevenTvV4Client.query<BadgesQueryQuery>({
      query: BadgesQueryDocument,
    });

    if (error) {
      throw error;
    }

    return (data?.badges?.badges ?? [])
      .filter(badge => pickBestImage(badge.images) !== undefined)
      .map<SanitisedBadgeSet>(sanitiseV4Badge)
      .sort((a, b) => a.title.localeCompare(b.title, 'en'));
  },
} as const;
