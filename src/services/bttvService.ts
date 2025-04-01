import {
  BttvChannelEmotesResponse,
  BttvGlobalEmotesResponse,
  EmotesList,
} from '../utils/third-party/types';
import { bttvApi } from './api';

export const bttvService = {
  getChannelEmotes: async (channelId: string): Promise<EmotesList> => {
    try {
      const result = await bttvApi.get<BttvChannelEmotesResponse>(
        `/cached/users/twitch/${channelId}`,
      );

      const sanitizedResult = [
        ...result.channelEmotes,
        ...result.sharedemotes,
      ].map(emote => ({
        id: emote.id,
        code: emote.code,
        channelId,
      }));

      return sanitizedResult;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
  getGlobalEmotes: async (): Promise<EmotesList> => {
    try {
      const result = await bttvApi.get<BttvGlobalEmotesResponse>(
        '/cached/emotes/global',
      );

      const sanitizedResult = result.map(c => ({
        id: c.id,
        code: c.code,
        channelId: null,
      }));

      return sanitizedResult;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
} as const;
