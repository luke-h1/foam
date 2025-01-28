import {
  BttvChannelEmotesResponse,
  BttvGlobalEmotesResponse,
  EmotesList,
} from '../utils/third-party/types';
import { bttvApi } from './api';

export const bttvService = {
  getChannelEmotes: async (channelId: string | null): Promise<EmotesList> => {
    if (!channelId) {
      return [];
    }

    try {
      const { data } = await bttvApi.get<BttvChannelEmotesResponse>(
        `/cached/users/twitch/${channelId}`,
      );

      const result = [...data.channelEmotes, ...data.sharedemotes].map(
        emote => ({
          id: emote.id,
          code: emote.code,
          channelId,
        }),
      );

      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
  getGlobalEmotes: async (): Promise<EmotesList> => {
    try {
      const { data } = await bttvApi.get<BttvGlobalEmotesResponse>(
        '/cached/emotes/global',
      );

      const result = data.map(c => ({
        id: c.id,
        code: c.code,
        channelId: null,
      }));

      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
} as const;
