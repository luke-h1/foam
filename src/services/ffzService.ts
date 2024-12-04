import {
  EmotesList,
  FfzBadgesResponse,
  FfzChannelEmotesResponse,
  FfzGlobalEmotesResponse,
} from '../utils/third-party/types';
import { ffzApi } from './api';

const ffzService = {
  getChannelEmotes: async (channelId: string | null): Promise<EmotesList> => {
    if (!channelId) {
      return [];
    }

    try {
      const { data } = await ffzApi.get<FfzChannelEmotesResponse>(
        `/room/id/${channelId}`,
      );

      const result = Object.values(data.sets).flatMap(set =>
        set.emoticons.map(emote => ({
          id: `${emote.id}`,
          code: emote.name,
          channelId,
        })),
      );

      return result;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },

  getGlobalEmotes: async (): Promise<EmotesList> => {
    try {
      const { data } = await ffzApi.get<FfzGlobalEmotesResponse>('/set/global');

      const result = Object.values(data.sets).flatMap(set =>
        set.emoticons.map(emote => ({
          id: `${emote.id}`,
          code: emote.name,
          channelId: null,
        })),
      );

      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
  getBadges: async () => {
    try {
      const { data } = await ffzApi.get<FfzBadgesResponse>('/badges');

      return data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        badges: [],
        users: {},
      } satisfies FfzBadgesResponse;
    }
  },
} as const;

export default ffzService;
