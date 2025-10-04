import { logger } from '@app/utils/logger';
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

export interface SevenTvVersion {
  id: string;
  name: string;
  description?: string;
  lifecycle: number;
  state: string[];
  listed: boolean;
  animated: boolean;
  host: SevenTvHost;
}

export interface StvConnection {
  id: string;
  platform: 'TWITCH' | 'YOUTUBE' | 'KICK';
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id: string;
}

export interface StvUser {
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
  id: string;
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

  /**
   * The person who added/removed this emote
   */
  actor_id?: string;
}

export const sevenTvService = {
  get7tvUserId: async (twitchUserId: string): Promise<string> => {
    const result = await sevenTvApi.get<{ user: { id: string } }>(
      `/users/twitch/${twitchUserId}`,
    );
    return result.user.id;
  },

  getEmoteSetId: async (twitchUserId: string): Promise<string> => {
    const result = await sevenTvApi.get<StvChannelEmotesResponse>(
      `/users/twitch/${twitchUserId}`,
    );

    if (!result.emote_set.id) {
      logger.stv.error('no set id returned from stv api');
    }

    return result.emote_set.id;
  },
  getSanitisedEmoteSet: async (
    emoteSetId: string,
  ): Promise<SanitisiedEmoteSet[]> => {
    const result = await sevenTvApi.get<StvEmoteSet>(
      `/emote-sets/${emoteSetId}`,
    );

    const sanitisedSet = result.emotes.map(emote => {
      const { owner } = emote.data;

      const emote4x =
        emote.data.host.files.find(file => file.name === '4x.avif') ||
        emote.data.host.files.find(file => file.name === '3x.avif') ||
        emote.data.host.files.find(file => file.name === '2x.avif') ||
        emote.data.host.files.find(file => file.name === '1x.avif');

      return {
        name: emote.name,
        id: emote.id,
        url: `https://cdn.7tv.app/emote/${emote.id}/${emote4x?.name ?? '1x.avif'}`,
        flags: emote.data.flags,
        original_name: emote.data.name,
        creator: (owner?.display_name || owner?.username) ?? 'UNKNOWN',
        emote_link: `https://7tv.app/emotes/${emote.id}`,
        site:
          emoteSetId === 'global' ? '7TV Global Emote' : '7TV Channel Emote',
        height: emote4x?.height,
        width: emote4x?.width,
      };
    });

    return sanitisedSet;
  },
  getEmote: async (emoteId: string) => {
    return sevenTvApi.get<StvEmote>(`/emotes/${emoteId}`);
  },
} as const;
