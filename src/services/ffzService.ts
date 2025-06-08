/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { logger } from '@app/utils/logger';
import { ffzApi } from './api';
import { SanitisiedEmoteSet } from './seventTvService';
import { SanitisedBadgeSet } from '.';

interface FfzEmoticon {
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

export const ffzService = {
  getSanitisedGlobalEmotes: async (): Promise<SanitisiedEmoteSet[]> => {
    try {
      const result = await ffzApi.get<FfzGlobalEmotesResponse>('/set/global');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const sanitisedSet = result.sets[
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        result.default_sets[0]
        // @ts-expect-error improve types of emote
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ].emoticons.map<SanitisiedEmoteSet>(emote => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          name: emote.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
          id: emote.id.toString(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          url: emote.animated
            ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4`
            : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
          emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          creator: 'UNKNOWN',
          site: 'Global FFZ',
          original_name: 'UNKNOWN',
        } satisfies SanitisiedEmoteSet;
      });

      return sanitisedSet as SanitisiedEmoteSet[];
    } catch (error) {
      logger.ffz.error('Error fetching global FFZ emotes:', error);
      return [];
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
            color: '#00ff00',
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
      logger.ffz.error('Error fetching FFZ badges:', error);
      return [];
    }
  },

  getSanitisedChannelEmotes: async (
    channelId: string,
  ): Promise<SanitisiedEmoteSet[]> => {
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
          emoteSet?.emoticons.map<SanitisiedEmoteSet>(emote => {
            const { owner } = emote;

            return {
              name: emote.name,
              id: emote.id.toString(),
              url: emote.animated
                ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4`
                : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
              emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
              creator: owner.name ?? 'unknown',
              site: 'FFZ',
              original_name: 'UNKNOWN',
            } satisfies SanitisiedEmoteSet;
          });
        return sanitistedSet ?? [];
      }
      return [];
    } catch (error) {
      logger.ffz.error(
        `Error fetching FFZ emotes for channel ${channelId}:`,
        error,
      );
      return [];
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
      logger.ffz.error('Error fetching FFZ badges:', error);
      return [];
    }
  },
} as const;
