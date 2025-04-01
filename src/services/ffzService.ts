import {
  EmotesList,
  FfzBadgesResponse,
  FfzChannelEmotesResponse,
  FfzGlobalEmotesResponse,
} from '../utils/third-party/types';
import { ffzApi } from './api';

export const ffzService = {
  getChannelEmotes: async (channelId: string): Promise<EmotesList> => {
    try {
      const result = await ffzApi.get<FfzChannelEmotesResponse>(
        `/room/id/${channelId}`,
      );

      const sanitizedResult = Object.values(result.sets).flatMap(set =>
        set.emoticons.map(emote => ({
          id: `${emote.id}`,
          code: emote.name,
          channelId,
        })),
      );

      return sanitizedResult;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },

  getGlobalEmotes: async (): Promise<EmotesList> => {
    try {
      const result = await ffzApi.get<FfzGlobalEmotesResponse>('/set/global');

      const sanitizedResult = Object.values(result.sets).flatMap(set =>
        set.emoticons.map(emote => ({
          id: `${emote.id}`,
          code: emote.name,
          channelId: null,
        })),
      );

      return sanitizedResult;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
  getBadges: async () => {
    try {
      return ffzApi.get<FfzBadgesResponse>('/badges');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        badges: [],
        users: {},
      } satisfies FfzBadgesResponse;
    }
  },
} as const;
