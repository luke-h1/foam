import { bttvApi } from './api';
import { BttvGlobalBadgesResponse } from './types/bttv/badge';
import {
  BttvChannelEmotesResponse,
  BttvGlobalEmotesResponse,
} from './types/bttv/emote';

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
