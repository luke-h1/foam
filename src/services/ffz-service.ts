/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { EmoteImageVariantSet, FfzSanitisedEmote } from '@app/types/emote';
import type { FfzBadgesResponse } from '@app/types/ffz/badge';
import type {
  FfzChannelEmotesResponse,
  FfzEmoticon,
  FfzGlobalEmotesResponse,
} from '@app/types/ffz/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';

import { ApiError } from './api/Client';
import { ffzApi } from './api/clients';
import { buildSanitisedEmote } from './emote-provider';

interface FFzErrorResponse {
  status: number;
  error: string;
  message: string;
}

/**
 * FFZ returns a 404 "No such room" for channels that have never configured FFZ;
 * that is a benign empty result, not a failure worth logging.
 */
function isNoSuchRoomError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
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
  } satisfies EmoteImageVariantSet;
  const animatedVariants: EmoteImageVariantSet = emote.animated
    ? {
        '2x': toFfzAnimatedUrl(emote.id, '2x'),
        '4x': toFfzAnimatedUrl(emote.id, '4x'),
      }
    : staticVariants;

  return {
    ...buildSanitisedEmote({
      id: emote.id.toString(),
      name: emote.name,
      site,
      creator,
      emoteLink: `https://www.frankerfacez.com/emoticon/${emote.id}`,
      animated: animatedVariants,
      static: staticVariants,
    }),
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
      if (isNoSuchRoomError(error)) {
        return [];
      }
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
      if (isNoSuchRoomError(error)) {
        return [];
      }
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
