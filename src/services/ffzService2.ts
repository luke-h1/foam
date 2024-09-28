import logger from '@app/utils/logger';
import { Mutex } from 'async-mutex';
import { ffzEmoteApi } from './Client';

interface FfzEmotesResponse {
  id: number;
  user: {
    id: number;
    name: string;
    displayName: string;
  };
  code: string;
  images: {
    '1x': string;
    '2x': string;
    '4x': string;
  };
  imageType: string;
}

// id: 1, buh, (id of emote and text of emote)
export type EmoteIDs = Map<string, string>;
export type ChannelEmotes = Map<string, EmoteIDs>;

export interface EmotePositions {
  [code: string]: string[];
}

// aquire a lock to ensure sevenTvStore doesn't make multiple requests at once
// due to the in-flight promise not being returned during multiple users
// are typing emotes on chat join
const mutex = new Mutex();

const ffzService2 = {
  getGlobalEmotes: async () => {
    const errorMessage = 'Failed to fetch global FFZ emotes';
    const release = await mutex.acquire();

    try {
      const response =
        await ffzEmoteApi.get<FfzEmotesResponse[]>('/emotes/global');
      return response.data;
    } catch (e) {
      logger.error(errorMessage, e);
      return [];
    } finally {
      release();
    }
  },
  getChannelEmotes: async (channelId: string) => {
    const errorMessage = 'Failed to fetch channel FFZ emotes';
    const release = await mutex.acquire();
    try {
      const response = await ffzEmoteApi.get<FfzEmotesResponse[]>(
        `/users/twitch/${channelId}`,
      );
      return response.data;
    } catch (e) {
      logger.error(errorMessage, e);
      return [];
    } finally {
      release();
    }
  },
};
export default ffzService2;
