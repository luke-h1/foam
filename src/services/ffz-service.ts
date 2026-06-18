/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { FfzSanitisedEmote } from '@app/types/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';
import { logger } from '@app/utils/logger';
import { ffzApi } from './api/clients';
import { SanitisedBadgeSet } from './twitch-badge-service';

export interface FfzEmoticon {
  id: number;
  name: string;
  height: number;
  width: number;
  public: boolean;
  hidden: boolean;
  animated: boolean;
  modifier: boolean;
  modifier_flags: number;
  owner: {
    _id: number;
    name: string;
    display_name: string;
  };
  urls: {
    '1': string;
    '2': string;
    '4': string;
  };
  status: number;
  usage_count: number;
  created_at: string;
  last_updated: string;
}
export interface FfzSet {
  id: number;
  _type: number;
  title: string;
  emoticons: FfzEmoticon[];
}

export interface FfzChannelEmotesResponse {
  room: {
    set: number | string;
    vip_badge?: { [key: string]: string };
    mod_urls?: { [key: string]: string };
    user_badge_ids?: { [key: string]: string[] };
    user_badges?: { [key: string]: string[] };
  };
  sets: {
    [setId: string]: FfzSet;
  };
}

export interface FfzGlobalEmotesResponse {
  default_sets: number[];
  sets: {
    [setId: string]: FfzSet;
  };
  users: {
    [userId: string]: string[];
  };
}

export interface FfzBadgesResponse {
  badges: FfzBadge[];
  users: FfzBadgeUsers;
}

export interface FfzBadge {
  id: number;
  name: string;
  title: string;
  slot: number;
  replaces: string;
  color: string;
  image: string;
  urls: {
    '1': string;
    '2': string;
    '4': string;
  };
}

interface FFzErrorResponse {
  status: number;
  error: string;
  message: string;
}

export interface FfzBadgeUsers {
  [badgeId: string]: string[];
}

function toFfzStaticUrl(emoteId: number, scale: '2x' | '4x'): string {
  return `https://cdn.frankerfacez.com/emote/${emoteId}/${scale === '2x' ? '2' : '4'}`;
}

function toFfzAnimatedUrl(emoteId: number, scale: '2x' | '4x'): string {
  return `https://cdn.frankerfacez.com/emote/${emoteId}/animated/${scale === '2x' ? '2' : '4'}`;
}

function sanitiseFfzEmote(
  emote: FfzEmoticon,
  site: FfzSanitisedEmote['site'],
  creator: string | null,
): FfzSanitisedEmote {
  const staticVariants = {
    '2x': emote.urls['2'] || toFfzStaticUrl(emote.id, '2x'),
    '4x': emote.urls['4'] || toFfzStaticUrl(emote.id, '4x'),
  };
  const animatedVariants = emote.animated
    ? {
        '2x': toFfzAnimatedUrl(emote.id, '2x'),
        '4x': toFfzAnimatedUrl(emote.id, '4x'),
      }
    : staticVariants;
  const imageVariants = createEmoteImageVariants({
    animated: animatedVariants,
    static: staticVariants,
  });

  return {
    name: emote.name,
    id: emote.id.toString(),
    url: animatedVariants['4x'],
    static_url: staticVariants['4x'],
    image_variants: imageVariants,
    emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
    creator,
    site,
    original_name: 'UNKNOWN',
    width: emote.width,
    height: emote.height,
    aspect_ratio: emote.height > 0 ? emote.width / emote.height : 1,
  };
}

export const ffzService = {
  getSanitisedGlobalEmotes: async (): Promise<FfzSanitisedEmote[]> => {
    try {
      const result = await ffzApi.get<FfzGlobalEmotesResponse>('/set/global');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const sanitisedSet = result.sets[
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        result.default_sets[0]
      ].emoticons.map<FfzSanitisedEmote>((emote: FfzEmoticon) =>
        sanitiseFfzEmote(emote, 'Global FFZ', 'UNKNOWN'),
      );

      return sanitisedSet as FfzSanitisedEmote[];
    } catch (error) {
      logger.ffz.warn('Failed to fetch global FFZ emotes', {
        name: 'ffz_emotes_warning',
        error,
        action: 'global_emotes_failed',
        provider: 'ffz',
        resource_type: 'emotes',
        scope: 'global',
      });
      throw error;
    }
  },

  getSanitisedChannelBadges: async (
    channelId: string,
  ): Promise<SanitisedBadgeSet[]> => {
    try {
      const result = await ffzApi.get<
        FfzChannelEmotesResponse | FFzErrorResponse
      >(`/room/id/${channelId}`);

      if ('message' in result && result.message === 'No such room') {
        return [];
      }

      const sanitisedBadges: SanitisedBadgeSet[] = [];

      if ('room' in result) {
        const { room } = result;

        // Process VIP badge
        if (room.vip_badge && Object.keys(room.vip_badge).length > 0) {
          const maxKey = Math.max(...Object.keys(room.vip_badge).map(Number));
          const maxUrl = room.vip_badge[maxKey.toString()] as string;

          sanitisedBadges.push({
            id: 'vip_badge',
            url: maxUrl,
            title: 'VIP',
            color: '#ff0000',
            owner_username: channelId,
            set: 'vip',
            type: 'FFZ channel badge',
          });
        }

        // Process mod badge
        if (room.mod_urls && Object.keys(room.mod_urls).length > 0) {
          const maxKey = Math.max(...Object.keys(room.mod_urls).map(Number));
          const maxUrl = room.mod_urls[maxKey.toString()] as string;

          sanitisedBadges.push({
            id: 'mod_badge',
            url: maxUrl,
            title: 'Moderator',
            color: '#1ac9a2',
            owner_username: channelId,
            set: 'mod',
            type: 'FFZ channel badge',
          });
        }

        // Process user badges
        if (room.user_badges) {
          Object.entries(room.user_badges).forEach(([badge, users]) => {
            users.forEach(user => {
              sanitisedBadges.push({
                id: badge,
                url: '',
                title: badge,
                color: '#ffffff',
                owner_username: user,
                set: badge,
                type: 'FFZ user badge',
              });
            });
          });
        }
      }

      return sanitisedBadges;
    } catch (error) {
      logger.ffz.warn('Failed to fetch channel FFZ badges', {
        name: 'ffz_badges_warning',
        error,
        action: 'channel_badges_failed',
        channel_id: channelId,
        provider: 'ffz',
        resource_type: 'badges',
        scope: 'channel',
      });
      throw error;
    }
  },

  getSanitisedChannelEmotes: async (
    channelId: string,
  ): Promise<FfzSanitisedEmote[]> => {
    try {
      const result = await ffzApi.get<
        FfzChannelEmotesResponse | FFzErrorResponse
      >(`/room/id/${channelId}`);

      if ('message' in result && result.message === 'No such room') {
        return [];
      }

      if ('sets' in result) {
        const emoteSet = result.sets[result.room.set];
        const sanitistedSet =
          emoteSet?.emoticons &&
          emoteSet?.emoticons.map<FfzSanitisedEmote>(emote =>
            sanitiseFfzEmote(emote, 'FFZ', emote.owner.name ?? 'unknown'),
          );
        return sanitistedSet ?? [];
      }
      return [];
    } catch (error) {
      logger.ffz.warn(`Failed to fetch channel FFZ emotes for ${channelId}`, {
        name: 'ffz_emotes_warning',
        error,
        action: 'channel_emotes_failed',
        channel_id: channelId,
        provider: 'ffz',
        resource_type: 'emotes',
        scope: 'channel',
      });
      throw error;
    }
  },

  getSanitisedGlobalBadges: async (): Promise<SanitisedBadgeSet[]> => {
    try {
      const result = await ffzApi.get<FfzBadgesResponse>('/badges');

      const sanitisedSet: SanitisedBadgeSet[] = [];
      const seen = new Set<string>();

      result.badges.forEach(badge => {
        result.users[badge.id]?.forEach(username => {
          const key = `${badge.title.replace(' ', '_').toLowerCase()}|${username}`;
          if (!seen.has(key)) {
            seen.add(key);
            sanitisedSet.push({
              id: badge.title.replace(' ', '_').toLowerCase(),
              url: badge.urls['4'],
              title: badge.title,
              color: badge.color,
              owner_username: username,
              set: badge.id.toString(),
              type: 'FFZ global badge',
            });
          }
        });
      });

      return sanitisedSet;
    } catch (error) {
      logger.ffz.warn('Failed to fetch global FFZ badges', {
        name: 'ffz_badges_warning',
        error,
        action: 'global_badges_failed',
        provider: 'ffz',
        resource_type: 'badges',
        scope: 'global',
      });
      throw error;
    }
  },
} as const;
