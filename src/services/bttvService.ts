import { bttvApi } from './api';

interface BttvBaseEmote {
  id: string;
  code: string;
  imageType: 'png' | 'gif';
}

export interface BttvCommonEmote extends BttvBaseEmote {
  userId: string;
}

export interface BttvDetailedEmote extends BttvBaseEmote {
  user: {
    id: string;
    name: string;
    displayName: string;
    providerId: string;
  };
}

export type BttvEmote = BttvCommonEmote | BttvDetailedEmote;

export type BttvGlobalEmotesResponse = BttvCommonEmote[];

export interface BttvChannelEmotesResponse {
  id: string;
  bots: string[];
  channelEmotes: BttvDetailedEmote[];
  sharedEmotes: BttvDetailedEmote[];
}

export interface BttvBadge {
  id: string;
  name: string;
  displayName: string;
  providerId: string;
  badge: {
    description: string;
    svg: string;
  };
}

export type BttvGlobalBadgesResponse = BttvBadge[];

const bttvService = {
  listGlobalEmotes: async (): Promise<BttvGlobalEmotesResponse> => {
    const { data } = await bttvApi.get<BttvGlobalEmotesResponse>(
      '/cached/emotes/global',
    );
    return data;
  },
  listChannelEmotes: async (
    channelId: string,
  ): Promise<BttvChannelEmotesResponse> => {
    const { data } = await bttvApi.get<BttvChannelEmotesResponse>(
      `/cached/users/twitch/${channelId}`,
    );
    return data;
  },
  listGlobalBadges: async (): Promise<BttvGlobalBadgesResponse> => {
    const { data } =
      await bttvApi.get<BttvGlobalBadgesResponse>('/cached/badges');
    return data;
  },
} as const;

export default bttvService;
