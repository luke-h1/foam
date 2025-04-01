import { EmotesList } from '@app/utils/third-party/types';
import { sevenTvApi } from './api';

interface SevenTvFile {
  name: string;
  static_name: string;
  width: number;
  height: number;
  frame_count: number;
  size: number;
  format: string;
}

interface SevenTvHost {
  url: string;
  files: SevenTvFile[];
}

interface SevenTvVersion {
  id: string;
  name: string;
  description?: string;
  lifecycle: number;
  state: string[];
  listed: boolean;
  animated: boolean;
  host: SevenTvHost;
}

interface StvConnection {
  id: string;
  platform: 'TWITCH' | 'YOUTUBE' | 'KICK';
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id: string;
}

interface StvUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  style: object;
  role_ids: string[];
  connection: StvConnection[];
}

export interface StvEmote {
  id: string;
  name: string;
  flags: number;
  tags: string[];
  lifecycle: number;
  state: string[];
  listed: boolean;
  animated: boolean;
  host: SevenTvHost;
  versions: SevenTvVersion[];
  createdAt: number;
  owner: StvUser;
}

interface Connection {
  id: string;
  platform: 'TWITCH';
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id: string;
}

export interface SevenTvEmote {
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
    state: string[];
    listed: boolean;
    animated: boolean;
    tags?: string[];

    owner: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      style: {
        paint_id?: string;
        badge_id?: string;
        color?: number;
      };
      role_ids: string[];
      connection: Connection[];
      roles?: string[];
    };
    host: {
      url: string;
      files: {
        name: string;
        static_name: string;
        width: number;
        height: number;
        frame_count: number;
        size: number;
        format: string;
      }[];
    };
  };
}

export interface StvEmoteSet {
  id: string;
  name: string;
  flags: number;
  immutable: boolean;
  privileged: boolean;
  emotes: SevenTvEmote[];
  emote_count: number;
  capacity: number;
  owner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    style: {
      color: number;
      badge_id: string;
      paint_id: string;
    };
    roles: string[];
  };
}

export type StvGlobalEmotesResponse = StvEmoteSet;

export type StvChannelEmotesResponse = {
  id: string;
  platform: string;
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set: StvEmoteSet;
  user: {
    id: string;
    username: string;
    display_name: string;
    created_at: number;
    avatar_url: string;
  };
};

export const sevenTvService = {
  getEmoteSetId: async (setId: string) => {},
  getStvUserId: async (userId: string): Promise<string> => {
    const { data } = await sevenTvApi.get<StvUser>(
      `https://7tv.io/v3/users/twitch/${userId}`,
    );

    return data.id;
  },
  getChannelEmotes: async (channelId: string | null): Promise<EmotesList> => {
    if (!channelId) {
      return [];
    }

    try {
      const { data } = await sevenTvApi.get<StvChannelEmotesResponse>(
        `/users/twitch/${channelId}`,
      );

      return data.emote_set.emotes.map(emote => ({
        id: emote.id,
        code: emote.name,
        // eslint-disable-next-line no-bitwise
        isZeroWidth: (emote.flags || 0 & 256) !== 0,
        channelId,
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
  getGlobalEmotes: async (): Promise<EmotesList> => {
    try {
      const { data } =
        await sevenTvApi.get<StvGlobalEmotesResponse>('/emote-sets/global');

      return data.emotes.map(c => ({
        id: c.id,
        code: c.name,
        // eslint-disable-next-line no-bitwise
        isZeroWidth: (c.flags || 0 & 256) !== 0,
        channelId: null,
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
  getEmote: async (emoteId: string) => {
    const { data } = await sevenTvApi.get<StvEmote>(`/emotes/${emoteId}`);
    return data;
  },
} as const;
