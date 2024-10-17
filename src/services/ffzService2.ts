import { Mutex } from 'async-mutex';

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
    const release = await mutex.acquire();

    try {
      const response =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore $TSFixMe
        await ffzCachedEmoteApi.get<FfzEmotesResponse[]>('/emotes/global');
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return [];
    } finally {
      release();
    }
  },
  getChannelEmotes: async (channelId: string) => {
    const release = await mutex.acquire();
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore $TSFixMe
      const response = await ffzCachedEmoteApi.get<FfzEmotesResponse[]>(
        `/users/twitch/${channelId}`,
      );
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return [];
    } finally {
      release();
    }
  },
};
export default ffzService2;
