import { logger } from '@app/utils/logger';
import axios, { AxiosHeaders } from 'axios';
import { twitchApi } from './api';

export interface PaginatedList<T> {
  data: T[];
  pagination: {
    cursor: string;
  };
  total?: number;
}

export interface UserInfoResponse {
  broadcaster_type: string;
  created_at: string;
  description: string;
  display_name: string;
  id: string;
  login: string;
  offline_image_url: string;
  profile_image_url: string;
  type: string;
  view_count: number;
}

export interface Stream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: unknown[];
  tags: string[];
  is_mature: boolean;
}

export interface Channel {
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
}

export interface Category {
  box_art_url: string;
  id: string;
  igdb_id?: string; // can be an empty string so we specify undefined to represent the falsy value
  name: string;
}

export interface SearchChannelResponse {
  broadcaster_language: string;
  broadcaster_login: string;
  display_name: string;
  game_id: string;
  game_name: string;
  id: string;
  is_live: boolean;
  tag_ids: unknown[];
  tags: string[];
  thumbnail_url: string;
  title: string;
  started_at: string;
}

export interface DefaultTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface Emote {
  format: string[];
  id: string;
  images: {
    url_1x: string;
    url_2x: string;
    url_4x: string;
    name: string;
    scale: ['1.0', '2.0', '3.0'];
    theme_mode: ['light', 'dark'];
  }[];
}

interface RefreshToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface TwitchTokenValidationResponse {
  client_id: string;
  scopes: null;
  expires_in: number;
}

interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number;
  is_featured: boolean;
}

interface TwitchClipResponse {
  data: TwitchClip[];
}

export const twitchService = {
  getRefreshToken: async (refreshToken: string): Promise<RefreshToken> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data } = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refreshToken}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  },

  listGlobalEmotes: async () => {
    const { data } = await twitchApi.get<{ data: Emote[] }>(
      '/chat/emotes/global',
    );
    return data;
  },

  /**
   * @returns a token for an anonymous user
   */
  getDefaultToken: async (): Promise<DefaultTokenResponse> => {
    const { data } = await axios.get<{ data: DefaultTokenResponse }>(
      `${process.env.AUTH_PROXY_API_BASE_URL}/token`,
      {
        headers: {
          'x-api-key': process.env.AUTH_PROXY_API_KEY,
        },
      },
    );

    if (!data.data.access_token) {
      console.error('no token received from auth lambda');
    }

    return data.data;
  },

  /**
   * @param token
   * @returns a boolean indicating whether the token is valid or not
   */
  validateToken: async (token: string): Promise<boolean> => {
    const res = await axios.get<TwitchTokenValidationResponse>(
      'https://id.twitch.tv/oauth2/validate',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.status === 200) {
      return true;
    }

    return false;
  },

  /**
   *
   * @param cursor
   * @returns an object that contains the top 20 streams and a cursor for further requests
   * @requires a non-anon token
   */
  getTopStreams: async (cursor?: string): Promise<PaginatedList<Stream>> => {
    const result = await twitchApi.get<PaginatedList<Stream>>('/streams', {
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID as string,
      },
      params: {
        ...(cursor && { after: cursor }),
      },
    });

    return result;
  },

  getStreamsUnderCategory: async (
    gameId: string,
    headers: AxiosHeaders,
    cursor?: string,
  ): Promise<PaginatedList<Stream>> => {
    const result = await twitchApi.get<PaginatedList<Stream>>('/streams', {
      headers,
      params: {
        game_id: gameId,
        ...(cursor && { after: cursor }),
      },
    });

    return result;
  },

  getStream: async (userLogin: string) => {
    const params: Record<string, string> = {};

    if (userLogin) {
      params.user_login = userLogin;
    }

    const result = await twitchApi.get<{ data: Stream[] }>('/streams', {
      params: {
        first: 15,
        ...params,
      },
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID as string,
      },
    });

    return result.data[0];
  },

  getChannel: async (userId: string): Promise<Channel> => {
    const result = await twitchApi.get<Channel[]>('/channels', {
      params: {
        broadcaster_id: userId,
      },
    });

    return result[0] as Channel;
  },

  getTopCategories: async (
    cursor?: string,
    beforeCursor?: string,
  ): Promise<PaginatedList<Category>> => {
    return twitchApi.get<PaginatedList<Category>>('/games/top', {
      params: {
        ...(beforeCursor && { before: beforeCursor }),
        ...(cursor && { after: cursor }),
      },
    });
  },

  getUserImage: async (userId: string): Promise<string> => {
    logger.twitch.info('fetching profile image for', userId);
    const result = await twitchApi.get<{
      data: { profile_image_url: string }[];
    }>('/users', {
      params: {
        login: userId,
      },
    });

    return result.data[0]?.profile_image_url as string;
  },
  getFollowedStreams: async (userId: string): Promise<Stream[]> => {
    const result = await twitchApi.get<{ data: Stream[] }>(
      '/streams/followed',
      {
        params: {
          user_id: userId,
        },
      },
    );
    return result.data;
  },

  getUserInfo: async (token: string): Promise<UserInfoResponse> => {
    const result = await twitchApi.get<{ data: UserInfoResponse[] }>('/users', {
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID as string,
        Authorization: `Bearer ${token}`,
      },
    });
    return result.data[0] as UserInfoResponse;
  },
  getUser: async (userId?: string, id?: string): Promise<UserInfoResponse> => {
    const params: Record<string, string> = {};
    if (userId) {
      params.login = userId;
    }

    if (id) {
      params.id = id;
    }

    const result = await twitchApi.get<{ data: UserInfoResponse[] }>('/users', {
      params,
    });

    return (result.data[0] as UserInfoResponse) ?? '';
  },

  searchChannels: async (query: string): Promise<SearchChannelResponse[]> => {
    const result = await twitchApi.get<{ data: SearchChannelResponse[] }>(
      '/search/channels',
      {
        params: {
          query,
        },
      },
    );

    return result.data;
  },
  getStreamsByCategory: async (
    gameId: string,
    cursor?: string,
  ): Promise<PaginatedList<Stream>> => {
    return twitchApi.get<PaginatedList<Stream>>('/streams', {
      params: {
        game_id: gameId,
        ...(cursor && { after: cursor }),
      },
    });
  },

  getCategory: async (id: string): Promise<Category> => {
    const result = await twitchApi.get<{ data: Category[] }>('/games', {
      params: {
        id,
      },
    });
    return result.data[0] as Category;
  },

  searchCategories: async (query: string, cursor?: string) => {
    return twitchApi.get<PaginatedList<Category>>('/search/categories', {
      params: {
        query,
        ...(cursor && { after: cursor }),
      },
    });
  },
  getClip: async (id: string): Promise<TwitchClip> => {
    const result = await twitchApi.get<TwitchClipResponse>('clips', {
      params: {
        id,
      },
    });
    return result.data[0] as TwitchClip;
  },

  // getSubscriberCount: async (userId: string) => {},

  // getUserBlockedList: async (
  //   id: string,
  //   headers: AxiosHeaders,
  //   cursor?: string,
  // ) => {},

  // blockUser: async (userId: string) => {},
  // unBlockUser: async (userId: string) => {},
};
