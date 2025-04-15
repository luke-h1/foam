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

export interface SanitisiedEmoteSet {
  name: string;
  url: string;
  flags?: number;
  original_name: string;
  creator: string | null;
  emote_link: string;
  site: string;
  height?: number;
  width?: number;

  // temporarily - review this
  bits?: number;
}

export const sevenTvService = {
  getEmoteSetId: async (twitchUserId: string): Promise<string> => {
    const result = await sevenTvApi.get<StvChannelEmotesResponse>(
      `/users/twitch/${twitchUserId}`,
    );
    return result.emote_set.id;
  },

  getSanitisedEmoteSet: async (
    emoteSetId: string,
  ): Promise<SanitisiedEmoteSet[]> => {
    const result = await sevenTvApi.get<StvEmoteSet>(
      `/emote-sets/${emoteSetId}`,
    );

    return result.emotes.map(emote => {
      const { owner } = emote.data;

      const creator =
        owner && Object.keys(owner).length > 0
          ? owner.display_name || owner.username || 'UNKNOWN'
          : 'NONE';

      const emote4x =
        emote.data.host.files.find(file => file.name === '4x.avif') ||
        emote.data.host.files.find(file => file.name === '3x.avif') ||
        emote.data.host.files.find(file => file.name === '2x.avif') ||
        emote.data.host.files.find(file => file.name === '1x.avif');

      return {
        name: emote.name,
        url: `https://cdn.7tv.app/emote/${emote.id}/${emote4x?.name || '1x.avif'}`,
        flags: emote.data.flags,
        original_name: emote.data.name,
        creator,
        emote_link: `https://7tv.app/emotes/${emote.id}`,
        site: 'unknown', // todo - work out whether it's a channel emote or global
        height: emote4x?.height,
        width: emote4x?.width,
      };
    });
  },

  getEmoteSet: async (twitchUserId: string): Promise<EmotesList> => {
    try {
      const result = await sevenTvApi.get<StvChannelEmotesResponse>(
        `/users/twitch/${twitchUserId}`,
      );

      return result.emote_set.emotes.map(emote => ({
        id: emote.id,
        code: emote.name,
        // eslint-disable-next-line no-bitwise
        isZeroWidth: (emote.flags || 0 & 256) !== 0,
        channelId: twitchUserId,
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },

  getGlobalEmotes: async (): Promise<EmotesList> => {
    try {
      const result =
        await sevenTvApi.get<StvGlobalEmotesResponse>('/emote-sets/global');

      return result.emotes.map(c => ({
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
    return sevenTvApi.get<StvEmote>(`/emotes/${emoteId}`);
  },
} as const;
