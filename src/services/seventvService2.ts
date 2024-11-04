import { Mutex } from 'async-mutex';
import { sevenTvApi } from './api';

export interface SeventTvFile {
  name: string;
  static_name: string;
  width: number;
  height: number;
  frame_count: number;
  size: number;
  format: 'AVIF' | 'WEBP';
}

export interface SeventTvEmote {
  id: string;
  name: string;
  flags: number;
  timestamp: number;
  actor_id: string;
  data: {
    id: string;
    name: string;
    flags: number;
    lifecycle: number;
    state: string[]; // ["LISTED", "PERSONAL"]
    listed: boolean;
    animated: boolean;
    host: {
      url: string; // this is the url to the emote image
      files: SeventTvFile[];
    };
  };
  owner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    style: object;
    roles: string[];
  };
}

export interface SevenTvGlobalEmoteResponse {
  id: string;
  name: string;
  flags: number;
  tags: string[] | [];
  immutable: boolean;
  privileged: boolean;
  emotes: SeventTvEmote[];
}

export interface SevenTvChannelEmoteResponse {
  id: string;
  platform: 'TWITCH' | 'KICK' | 'YOUTUBE';
  username: string; // xqc
  display_name: string; // xQc
  linked_at: number;
  emote_capacity: number;
  emote_set_id: number | null;
  emote_set: {
    id: string;
    name: string;
    flags: number;
    tags: string[];
    immutable: boolean;
    privileged: boolean;
    emotes: SeventTvEmote[];
  };
}
// aquire a lock to ensure sevenTvStore doesn't make multiple requests at once
// due to the in-flight promise not being returned during multiple users
// are typing emotes on chat join
const mutex = new Mutex();

const seventvService = {
  getGlobalEmotes: async () => {
    const release = await mutex.acquire();

    try {
      const { data } =
        await sevenTvApi.get<SevenTvGlobalEmoteResponse>('/emote-sets/global');
      return data.emotes;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return [];
    } finally {
      release();
    }
  },
  getChannelEmotes: async (id: string) => {
    const release = await mutex.acquire();

    try {
      const response = await sevenTvApi.get<SevenTvChannelEmoteResponse>(
        `/users/twitch/${id}`,
      );
      return response.data.emote_set.emotes;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return [];
    } finally {
      release();
    }
  },
};

export default seventvService;
