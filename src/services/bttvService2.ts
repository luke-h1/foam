import { Mutex } from 'async-mutex';
import { bttvCachedApi } from './api';

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

    try {
      const response =
        await bttvCachedApi.get<BttvGlobalEmotesResponse[]>('/emotes/global');
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return [];
    } finally {
      release();
    }
  },
  getChannelEmotes: async (channelId: string) => {
    const emptyResponse: BttvChannelEmotesResponse = {
      channelEmotes: [],
      sharedEmotes: [],
    };
    const release = await mutex.acquire();

    try {
      const { data } = await bttvCachedApi.get<BttvChannelEmotesResponse>(
        `/users/twitch/${channelId}`,
      );

      if (!data.id) {
        return emptyResponse;
      }
      return data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return emptyResponse;
    } finally {
      release();
    }
  },
};
export default bttvService2;
