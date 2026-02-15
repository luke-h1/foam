import {
  EmoteSetKind,
  type Image,
  Platform,
  UserCosmeticsDocument,
  UserCosmeticsQuery,
  UserCosmeticsQueryVariables,
  UserPersonalEmotesQueryDocument,
  UserPersonalEmotesQueryQuery,
  UserPersonalEmotesQueryQueryVariables,
} from '@app/graphql/generated/gql';
import type {
  SevenTvEmoteSetMetadata,
  SevenTvSanitisedEmote,
} from '@app/types/emote';
import { logger } from '@app/utils/logger';
import { sevenTvApi } from './api';
import { sevenTvV4Client } from './gql/client';

/**
 * Pick the best format from a set of images at the same scale.
 * Prefers AVIF > WebP > first available.
 */
function pickBestFormat(imgs: Image[]): Image | undefined {
  return (
    imgs.find(img => img.mime === 'image/avif') ??
    imgs.find(img => img.mime === 'image/webp') ??
    imgs[0]
  );
}

export function pickBestImage(images: readonly Image[]): Image | undefined {
  const scales = [4, 3, 2, 1];

  const result = scales.reduce<Image | undefined>((found, targetScale) => {
    if (found) return found;

    const atScale = images.filter(img => img.scale === targetScale);
    if (atScale.length === 0) return undefined;

    const animated = atScale.filter(img => img.frameCount > 1);
    return animated.length > 0
      ? pickBestFormat(animated)
      : pickBestFormat(atScale);
  }, undefined);

  return result;
}

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

export interface StvEmote {
  id: string;
  name: string;
  flags: number;
  tags: string[];
  lifecycle: number;
  state: string[];
  listed: boolean;
  animated: boolean;
  host: SevenTvHost;
  versions: {
    id: string;
    name: string;
    description?: string;
    lifecycle: number;
    state: string[];
    listed: boolean;
    animated: boolean;
    host: SevenTvHost;
  }[];
  createdAt: number;
  owner: StvUser;
}

type V4User = NonNullable<UserCosmeticsQuery['users']['user']>;

export type V4Paint = NonNullable<V4User['style']['activePaint']>;

export type V4Badge = NonNullable<V4User['style']['activeBadge']>;

export interface UserCosmeticsInfo {
  userId: string;
  ttvUserId: string | null;
  paintId: string | null;
  badgeId: string | null;
  paint: V4Paint | null;
  badge: V4Badge | null;
}

/**
 * Pick the best file from a v3 REST host.files array.
 * Prefers 4x AVIF > 3x AVIF > 2x AVIF > 1x AVIF, then any available.
 */
function pickBestV3File(files: SevenTvFile[]): SevenTvFile | undefined {
  return (
    files.find(file => file.name === '4x.avif') ||
    files.find(file => file.name === '3x.avif') ||
    files.find(file => file.name === '2x.avif') ||
    files.find(file => file.name === '1x.avif') ||
    files[0]
  );
}

export const sevenTvService = {
  get7tvUserId: async (twitchUserId: string): Promise<string> => {
    const result = await sevenTvApi.get<{ user: { id: string } }>(
      `/users/twitch/${twitchUserId}`,
    );
    return result.user.id;
  },

  getEmoteSetId: async (twitchUserId: string): Promise<string> => {
    const result = await sevenTvApi.get<StvChannelEmotesResponse>(
      `/users/twitch/${twitchUserId}`,
    );

    if (!result.emote_set.id) {
      logger.stv.error('no set id returned from stv api');
    }

    return result.emote_set.id;
  },

  getSanitisedEmoteSet: async (
    emoteSetId: string,
  ): Promise<SevenTvSanitisedEmote[]> => {
    const result = await sevenTvApi.get<StvEmoteSet>(
      `/emote-sets/${emoteSetId}`,
    );

    const site = emoteSetId === 'global' ? '7TV Global' : '7TV Channel';

    const setMetadata: SevenTvEmoteSetMetadata = {
      setId: result.id,
      setName: result.name,
      capacity: result.capacity,
      ownerId: result.owner?.id ?? null,
      kind: EmoteSetKind.Normal,
      updatedAt: '',
      totalCount: result.emote_count,
    };

    return result.emotes.map(emote => {
      const { owner } = emote.data;
      const bestFile = pickBestV3File(emote.data.host.files);

      return {
        name: emote.name,
        id: emote.id,
        url: `https://cdn.7tv.app/emote/${emote.id}/${bestFile?.name ?? '2x.avif'}`,
        flags: emote.data.flags,
        original_name: emote.data.name,
        creator: (owner?.display_name || owner?.username) ?? null,
        emote_link: `https://7tv.app/emotes/${emote.id}`,
        site,
        frame_count: bestFile?.frame_count ?? 1,
        format: bestFile?.format ?? 'avif',
        aspect_ratio:
          bestFile && bestFile.height > 0
            ? bestFile.width / bestFile.height
            : 1,
        // eslint-disable-next-line no-bitwise
        zero_width: Boolean(emote.data.flags & 256),
        width: bestFile?.width ?? 0,
        height: bestFile?.height ?? 0,
        set_metadata: setMetadata,
      };
    });
  },

  getEmote: async (emoteId: string) => {
    return sevenTvApi.get<StvEmote>(`/emotes/${emoteId}`);
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
        error.message,
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

      const imgScale = bestImage?.scale ?? 1;
      const imgWidth = bestImage ? Math.round(bestImage.width / imgScale) : 0;
      const imgHeight = bestImage ? Math.round(bestImage.height / imgScale) : 0;

      return {
        name: emoteName,
        id: emote.id,
        url: bestImage?.url ?? '',
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
    try {
      const { data, error } = await sevenTvV4Client.query<
        UserCosmeticsQuery,
        UserCosmeticsQueryVariables
      >({
        query: UserCosmeticsDocument,
        variables: { id: sevenTvUserId },
      });

      if (error) {
        logger.stv.error('v4 GQL request failed:', error.message);
        return null;
      }

      const user = data?.users?.user;

      if (!user) {
        return null;
      }

      const twitchConnection = user.connections.find(
        conn => conn.platform === Platform.Twitch,
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
    } catch (error) {
      logger.stv.error('Failed to fetch user cosmetics via GQL:', error);
      return null;
    }
  },
} as const;
