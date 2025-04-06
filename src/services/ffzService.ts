import { ffzApi } from './api';
import { SanitisiedEmoteSet } from './seventTvService';

export interface SanitisedBadgeSet {
  id: string;
  url: string;
  title: string;
  color: string;
  owner_username: string;
}

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
  room: unknown;
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

export interface FfzBadgeUsers {
  [badgeId: string]: string[];
}

export const ffzService = {
  getSanitisedGlobalEmotes: async (): Promise<SanitisiedEmoteSet[]> => {
    const result = await ffzApi.get<FfzGlobalEmotesResponse>('/set/global');

    return result.sets[
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      result.default_sets[0]
      // @ts-expect-error improve types of emote
    ].emoticons.map<SanitisiedEmoteSet>(emote => {
      const { owner } = emote;

      const creator =
        owner && Object.keys(owner).length > 0
          ? owner.display_name || owner.name || 'UNKNOWN'
          : 'NONE';

      return {
        name: emote.name,
        url: emote.animated
          ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4`
          : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
        emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
        creator,
        site: 'Global FFZ',
        original_name: 'UNKNOWN',
      } satisfies SanitisiedEmoteSet;
    });
  },

  getSanitisedChannelEmotes: async (channelId: string) => {
    const result = await ffzApi.get<FfzChannelEmotesResponse>(
      `/room/id/${channelId}`,
    );

    // @ts-expect-error improve types
    return result.sets[result.room.set].emoticons.map<SanitisiedEmoteSet>(
      emote => {
        const { owner } = emote;

        const creator =
          owner && Object.keys(owner).length > 0
            ? owner.display_name || owner.name || 'UNKNOWN'
            : 'NONE';

        return {
          name: emote.name,
          url: emote.animated
            ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4`
            : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
          emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
          creator,
          site: 'FFZ',
          original_name: 'UNKNOWN',
        } satisfies SanitisiedEmoteSet;
      },
    );
  },
  getBadges: async (): Promise<SanitisedBadgeSet[]> => {
    const result = await ffzApi.get<FfzBadgesResponse>(
      'https://api.frankerfacez.com/v1/badges',
    );

    const sanitisedSet: SanitisedBadgeSet[] = [];

    result.badges.forEach(badge => {
      result.users[badge.id]?.forEach(username => {
        sanitisedSet.push({
          id: badge.title.replace(' ', '_').toLowerCase(),
          url: badge.urls['4'],
          title: badge.title,
          color: badge.color,
          owner_username: username,
        });
      });
    });

    return sanitisedSet;
  },
} as const;
