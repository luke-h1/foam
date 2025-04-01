import axios from 'axios';
import { ffzApi } from './api';
import {
  FfzApGlobalBadgesResponse,
  FfzGlobalBadgesResponse,
} from './types/ffz/badge';
import {
  FfzChannelEmotesResponse,
  FfzEmojiResponse,
  FfzGlobalEmotesResponse,
} from './types/ffz/emote';

const CDN_URL = 'https://cdn.frankerfacez.com';
const AP_URL = 'https://api.ffzap.com';

const ffzService = {
  listGlobalEmotes: async (): Promise<FfzGlobalEmotesResponse> => {
    const { data } = await ffzApi.get<FfzGlobalEmotesResponse>('/set/global');
    return data;
  },
  listChannelEmotes: async (
    channelId: string,
  ): Promise<FfzChannelEmotesResponse> => {
    const { data } = await ffzApi.get<FfzChannelEmotesResponse>(
      `/room/id/${channelId}`,
    );
    return data;
  },
  listEmoji: async (): Promise<FfzEmojiResponse> => {
    const { data } = await axios.get(`${CDN_URL}/static/emoji/v3.2.json`);
    return data;
  },
  listGlobalBadges: async (): Promise<FfzGlobalBadgesResponse> => {
    const { data } = await ffzApi.get<FfzGlobalBadgesResponse>('/badges/ids');
    return data;
  },
  listApGlobalBadges: async (): Promise<FfzApGlobalBadgesResponse> => {
    const { data } = await axios.get<FfzApGlobalBadgesResponse>(
      `${AP_URL}/v1/supporters`,
    );
    return data;
  },
} as const;

export default ffzService;
