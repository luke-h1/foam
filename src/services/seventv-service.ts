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

export interface SevenTvHost {
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
  frame_count?: number;
  static_name?: string;
  format?: string;

  // temporarily - review this
  bits?: number;

  /**
   * The person who added/removed this emote
   */
  actor?: StvUser;
}

/**
 * 7TV Bridge Event API Types
 * Used for batch fetching user cosmetics
 */
export interface BridgeEventIdentifier {
  platform: 'TWITCH';
  id: string;
}

export interface BridgeEventRequest {
  identifiers: BridgeEventIdentifier[];
}

export interface BridgeEventUserStyle {
  paint_id?: string;
  badge_id?: string;
}

export interface BridgeEventUserConnection {
  platform: 'TWITCH' | 'YOUTUBE' | 'KICK';
  id: string;
  username: string;
}

export interface BridgeEventUser {
  username: string;
  avatar_url?: string;
  style?: BridgeEventUserStyle;
  connections: BridgeEventUserConnection[];
}

export interface BridgeEventBody {
  object: {
    data: {
      user: BridgeEventUser;
    };
  };
}

export interface BridgeEventResponse {
  body: BridgeEventBody;
}

/**
 * 7TV GQL User Style Types
 * Used for fetching individual user's paint/badge data
 */
export interface GqlPaintStop {
  at: number;
  color: number;
}

export interface GqlPaintShadow {
  x_offset: number;
  y_offset: number;
  radius: number;
  color: number;
}

export interface GqlPaint {
  id: string;
  kind: string;
  name: string;
  function: string;
  color: number | null;
  angle: number;
  shape?: string;
  image_url?: string;
  repeat: boolean;
  stops: GqlPaintStop[];
  shadows: GqlPaintShadow[];
}

export interface GqlBadge {
  id: string;
  kind: string;
  name: string;
  tooltip: string;
  tag?: string;
}

export interface GqlUserStyle {
  color?: number;
  paint?: GqlPaint;
  badge?: GqlBadge;
}

export interface GqlUserConnection {
  id: string;
  platform: string;
}

export interface GqlUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  style?: GqlUserStyle;
  connections: GqlUserConnection[];
}

export interface GqlUserResponse {
  data?: {
    user?: GqlUser;
  };
}

export interface UserCosmeticsInfo {
  userId: string; // 7TV user ID
  ttvUserId: string | null; // Twitch user ID
  paintId: string | null;
  badgeId: string | null;
  paint: GqlPaint | null;
  badge: GqlBadge | null;
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

      const emoteUrl =
        emote.data.host.files.find(file => file.name === '4x.avif') ||
        emote.data.host.files.find(file => file.name === '3x.avif') ||
        emote.data.host.files.find(file => file.name === '2x.avif') ||
        emote.data.host.files.find(file => file.name === '1x.avif');

      return {
        name: emote.name,
        id: emote.id,
        url: `https://cdn.7tv.app/emote/${emote.id}/${emoteUrl?.name ?? '2x.avif'}`,
        flags: emote.data.flags,
        original_name: emote.data.name,
        creator: (owner?.display_name || owner?.username) ?? 'UNKNOWN',
        emote_link: `https://7tv.app/emotes/${emote.id}`,
        site:
          emoteSetId === 'global' ? '7TV Global Emote' : '7TV Channel Emote',
        height: emoteUrl?.height,
        width: emoteUrl?.width,
        frame_count: emoteUrl?.frame_count,
        static_name: emoteUrl?.static_name,
        format: emoteUrl?.format,
      };
    });

    return sanitisedSet;
  },
  getEmote: async (emoteId: string) => {
    return sevenTvApi.get<StvEmote>(`/emotes/${emoteId}`);
  },
  sendPresence: async (channelId: string, userId: string) => {
    return sevenTvApi.post(`/users/${userId}/presences`, {
      kind: 1,
      passive: true,
      session_id: '',
      data: {
        platform: 'TWITCH',
        id: String(channelId),
      },
    });
  },

  /**
   * Batch fetch cosmetics for multiple users via bridge/event-api
   * Returns basic cosmetic info (paint_id, badge_id) for each user
   * @param twitchUserIds - Array of Twitch user IDs
   */
  getUsersCosmetics: async (
    twitchUserIds: string[],
  ): Promise<
    {
      twitchUserId: string;
      username?: string;
      avatarUrl?: string;
      paintId?: string;
      badgeId?: string;
    }[]
  > => {
    if (twitchUserIds.length === 0) {
      return [];
    }

    try {
      const response = await fetch('https://7tv.io/v3/bridge/event-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifiers: twitchUserIds.map(id => ({
            platform: 'TWITCH',
            id,
          })),
        } satisfies BridgeEventRequest),
      });

      if (!response.ok) {
        logger.stv.error('Bridge API request failed:', response.status);
        return [];
      }

      const data = (await response.json()) as BridgeEventResponse[];

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      return data.map(item => {
        const {
          body: {
            object: {
              data: { user },
            },
          },
        } = item;
        const twitchConnection = user.connections.find(
          conn => conn.platform === 'TWITCH',
        );

        return {
          twitchUserId: twitchConnection?.id ?? '',
          username: twitchConnection?.username,
          avatarUrl: user.avatar_url,
          paintId: user.style?.paint_id,
          badgeId: user.style?.badge_id,
        };
      });
    } catch (error) {
      logger.stv.error('Failed to fetch users cosmetics:', error);
      return [];
    }
  },

  /**
   * Fetch a user's full cosmetics (paint + badge data) via GQL
   * Use this when you need the actual paint/badge styling data
   * @param sevenTvUserId - The 7TV user ID (not Twitch ID)
   */
  getUserCosmeticsGql: async (
    sevenTvUserId: string,
  ): Promise<UserCosmeticsInfo | null> => {
    try {
      const response = await fetch('https://7tv.io/v3/gql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `query GetUserForUserPage($id: ObjectID!) {
            user(id: $id) {
              id
              username
              display_name
              avatar_url
              style {
                color
                paint {
                  id
                  kind
                  name
                  function
                  color
                  angle
                  shape
                  image_url
                  repeat
                  stops { at color }
                  shadows { x_offset y_offset radius color }
                }
                badge {
                  id
                  kind
                  name
                  tooltip
                  tag
                }
              }
              connections { id platform }
            }
          }`,
          variables: { id: sevenTvUserId },
        }),
      });

      if (!response.ok) {
        logger.stv.error('GQL request failed:', response.status);
        return null;
      }

      const result = (await response.json()) as GqlUserResponse;
      const user = result.data?.user;

      if (!user) {
        return null;
      }

      const twitchConnection = user.connections.find(
        conn => conn.platform === 'TWITCH',
      );

      return {
        userId: user.id,
        ttvUserId: twitchConnection?.id ?? null,
        paintId: user.style?.paint?.id ?? null,
        badgeId: user.style?.badge?.id ?? null,
        paint: user.style?.paint ?? null,
        badge: user.style?.badge ?? null,
      };
    } catch (error) {
      logger.stv.error('Failed to fetch user cosmetics via GQL:', error);
      return null;
    }
  },
} as const;
