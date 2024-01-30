import logger from '@app/utils/logger';
import { Mutex } from 'async-mutex';
import { bttvEmoteApi } from './Client';

export interface BttvEmote {
  id: string;
  code: string;
  imageType: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    displayName: string;
    providerId: string;
  };
}

type BttvGlobalEmotesResponse = Omit<BttvEmote, 'user'>;

export interface BttvChannelEmotesResponse {
  id?: string;
  bots?: unknown[];
  avatar?: string;
  channelEmotes: BttvEmote[];
  sharedEmotes: BttvEmote[];
}

// aquire a lock to ensure sevenTvStore doesn't make multiple requests at once
// due to the in-flight promise not being returned during multiple users
// are typing emotes on chat join
const mutex = new Mutex();

const bttvService2 = {
  getGlobalEmotes: async () => {
    const release = await mutex.acquire();

    const errorMessage = 'Failed to fetch global BTTV emotes';
    try {
      const response =
        await bttvEmoteApi.get<BttvGlobalEmotesResponse[]>('/emotes/global');
      return response.data;
    } catch (e) {
      logger.error(errorMessage, e);
      return [];
    } finally {
      release();
    }
  },
  getChannelEmotes: async (channelId: string) => {
    const errorMessage = 'Failed to fetch channel BTTV emotes';
    const emptyResponse: BttvChannelEmotesResponse = {
      channelEmotes: [],
      sharedEmotes: [],
    };
    const release = await mutex.acquire();

    try {
      const { data } = await bttvEmoteApi.get<BttvChannelEmotesResponse>(
        `/users/twitch/${channelId}`,
      );

      if (!data.id) {
        logger.error(errorMessage, 'unknown channel');
        return emptyResponse;
      }
      return data;
    } catch (e) {
      logger.error(errorMessage, e);
      return emptyResponse;
    } finally {
      release();
    }
  },
};
export default bttvService2;
